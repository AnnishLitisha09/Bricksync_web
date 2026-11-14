import 'dart:io';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'customer_service.dart';

class StatementExportResult {
  final bool success;
  final String? filePath;
  final String? error;
  final double totalDebit;
  final double totalCredit;
  final double netBalance;
  final int recordCount;

  StatementExportResult({
    required this.success,
    this.filePath,
    this.error,
    this.totalDebit = 0.0,
    this.totalCredit = 0.0,
    this.netBalance = 0.0,
    this.recordCount = 0,
  });
}

class StatementExportService {
  static Future<StatementExportResult> generateAndDownloadStatement({
    required CustomerItem customer,
    required List<CustomerLedgerEntry> allEntries,
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      final start = DateTime(startDate.year, startDate.month, startDate.day);
      final end = DateTime(endDate.year, endDate.month, endDate.day, 23, 59, 59);

      // 1. Calculate opening balance before startDate
      double creditBefore = 0.0;
      double debitBefore = 0.0;
      for (final e in allEntries) {
        DateTime? dt;
        try {
          dt = DateTime.parse(e.date);
        } catch (_) {}
        if (dt != null && dt.isBefore(start)) {
          creditBefore += e.credit;
          debitBefore += e.debit;
        }
      }
      double cumulativeOpeningBalance = creditBefore - debitBefore;

      // 2. Filter entries within range
      final inRange = allEntries.where((e) {
        DateTime? dt;
        try {
          dt = DateTime.parse(e.date);
        } catch (_) {}
        if (dt == null) return false;
        return !dt.isBefore(start) && !dt.isAfter(end);
      }).toList();

      // Sort chronological
      inRange.sort((a, b) {
        try {
          return DateTime.parse(a.date).compareTo(DateTime.parse(b.date));
        } catch (_) {
          return 0;
        }
      });

      // Prepare table rows
      final List<List<String>> tableData = [];

      // Opening balance row
      final startStr = "${startDate.day.toString().padLeft(2, '0')}-${startDate.month.toString().padLeft(2, '0')}-${startDate.year}";
      tableData.add([
        startStr,
        "-",
        "OPENING BALANCE (B/F)",
        "-",
        cumulativeOpeningBalance > 0 ? cumulativeOpeningBalance.toStringAsFixed(2) : "0.00",
      ]);

      double totalCredit = cumulativeOpeningBalance > 0 ? cumulativeOpeningBalance : 0.0;
      double totalDebit = 0.0;

      for (final e in inRange) {
        String displayDate = e.date;
        try {
          final dt = DateTime.parse(e.date);
          displayDate = "${dt.day.toString().padLeft(2, '0')}-${dt.month.toString().padLeft(2, '0')}-${dt.year}";
        } catch (_) {}

        final refId = e.id.replaceAll('ORD-', '').replaceAll('STMT-', '');
        final debitStr = e.debit > 0 ? e.debit.toStringAsFixed(2) : "-";
        final creditStr = e.credit > 0 ? e.credit.toStringAsFixed(2) : "-";

        totalDebit += e.debit;
        totalCredit += e.credit;

        tableData.add([
          displayDate,
          refId,
          e.particulars,
          debitStr,
          creditStr,
        ]);
      }

      final netBalance = totalCredit - totalDebit;

      // 3. Build PDF
      final pdf = pw.Document();

      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(24),
          build: (pw.Context context) {
            return [
              // Header Banner (matching web: Dark Slate with gold accent)
              pw.Container(
                decoration: const pw.BoxDecoration(
                  color: PdfColor.fromInt(0xFF0F172A), // Slate 900
                  borderRadius: pw.BorderRadius.all(pw.Radius.circular(6)),
                ),
                padding: const pw.EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          "M.ASWATH",
                          style: pw.TextStyle(
                            fontSize: 20,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColors.white,
                          ),
                        ),
                        pw.SizedBox(height: 3),
                        pw.Text(
                          "HOLLOW BRICKS & LORRY SERVICES",
                          style: const pw.TextStyle(
                            fontSize: 8.5,
                            color: PdfColor.fromInt(0xFFCBD5E1),
                          ),
                        ),
                        pw.Text(
                          "Suppliers of All Building Materials • Tiruppur",
                          style: const pw.TextStyle(
                            fontSize: 7.5,
                            color: PdfColor.fromInt(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ),
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.end,
                      children: [
                        pw.Text(
                          "ACCOUNT STATEMENT",
                          style: pw.TextStyle(
                            fontSize: 12,
                            fontWeight: pw.FontWeight.bold,
                            color: const PdfColor.fromInt(0xFFEAB308), // Gold Accent
                          ),
                        ),
                        pw.SizedBox(height: 3),
                        pw.Text(
                          "DATE: ${DateTime.now().day.toString().padLeft(2, '0')}/${DateTime.now().month.toString().padLeft(2, '0')}/${DateTime.now().year}",
                          style: const pw.TextStyle(fontSize: 8, color: PdfColors.white),
                        ),
                        pw.Text(
                          "PERIOD: ${startDate.day}/${startDate.month}/${startDate.year} - ${endDate.day}/${endDate.month}/${endDate.year}",
                          style: const pw.TextStyle(fontSize: 8, color: PdfColor.fromInt(0xFFCBD5E1)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              pw.SizedBox(height: 14),

              // Customer target info box
              pw.Container(
                decoration: pw.BoxDecoration(
                  color: const PdfColor.fromInt(0xFFF8FAFC),
                  border: pw.Border.all(color: const PdfColor.fromInt(0xFFE2E8F0)),
                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(6)),
                ),
                padding: const pw.EdgeInsets.all(10),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          "STATEMENT FOR:",
                          style: pw.TextStyle(
                            fontSize: 8,
                            fontWeight: pw.FontWeight.bold,
                            color: const PdfColor.fromInt(0xFF64748B),
                          ),
                        ),
                        pw.SizedBox(height: 2),
                        pw.Text(
                          customer.name.toUpperCase(),
                          style: pw.TextStyle(
                            fontSize: 14,
                            fontWeight: pw.FontWeight.bold,
                            color: const PdfColor.fromInt(0xFF0F172A),
                          ),
                        ),
                        if (customer.phone.isNotEmpty || customer.location.isNotEmpty) ...[
                          pw.SizedBox(height: 2),
                          pw.Text(
                            "${customer.phone.isNotEmpty ? 'Phone: ${customer.phone}' : ''} ${customer.location.isNotEmpty ? '• ${customer.location}' : ''}",
                            style: const pw.TextStyle(fontSize: 8.5, color: PdfColor.fromInt(0xFF64748B)),
                          ),
                        ],
                      ],
                    ),
                    pw.Container(
                      padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: pw.BoxDecoration(
                        color: const PdfColor.fromInt(0xFFECFDF5),
                        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
                        border: pw.Border.all(color: const PdfColor.fromInt(0xFFA7F3D0)),
                      ),
                      child: pw.Text(
                        "OFFICIAL LEDGER",
                        style: pw.TextStyle(
                          fontSize: 8,
                          fontWeight: pw.FontWeight.bold,
                          color: const PdfColor.fromInt(0xFF047857),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              pw.SizedBox(height: 14),

              // Table
              pw.TableHelper.fromTextArray(
                context: context,
                headers: ['DATE', 'REF #', 'PARTICULARS / DESCRIPTION', 'DEBIT (PAID)', 'CREDIT (SALE)'],
                data: tableData,
                headerStyle: pw.TextStyle(
                  fontSize: 8,
                  fontWeight: pw.FontWeight.bold,
                  color: const PdfColor.fromInt(0xFF0F172A),
                ),
                headerDecoration: const pw.BoxDecoration(
                  color: PdfColor.fromInt(0xFFF1F5F9),
                ),
                cellStyle: const pw.TextStyle(
                  fontSize: 8,
                  color: PdfColor.fromInt(0xFF334155),
                ),
                cellAlignments: {
                  0: pw.Alignment.centerLeft,
                  1: pw.Alignment.centerLeft,
                  2: pw.Alignment.centerLeft,
                  3: pw.Alignment.centerRight,
                  4: pw.Alignment.centerRight,
                },
                cellPadding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                border: const pw.TableBorder(
                  horizontalInside: pw.BorderSide(color: PdfColor.fromInt(0xFFE2E8F0), width: 0.5),
                  bottom: pw.BorderSide(color: PdfColor.fromInt(0xFFCBD5E1), width: 1),
                ),
              ),

              pw.SizedBox(height: 12),

              // Totals summary section
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.end,
                children: [
                  pw.Container(
                    width: 250,
                    child: pw.Column(
                      children: [
                        pw.Row(
                          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                          children: [
                            pw.Text(
                              "TOTAL TRANSACTIONS",
                              style: pw.TextStyle(
                                fontSize: 8.5,
                                fontWeight: pw.FontWeight.bold,
                                color: const PdfColor.fromInt(0xFF64748B),
                              ),
                            ),
                            pw.Text(
                              "₹ ${totalDebit.toStringAsFixed(2)} | ₹ ${totalCredit.toStringAsFixed(2)}",
                              style: pw.TextStyle(
                                fontSize: 8.5,
                                fontWeight: pw.FontWeight.bold,
                                color: const PdfColor.fromInt(0xFF0F172A),
                              ),
                            ),
                          ],
                        ),
                        pw.SizedBox(height: 6),
                        pw.Container(
                          padding: const pw.EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: const pw.BoxDecoration(
                            color: PdfColor.fromInt(0xFF0F172A),
                            borderRadius: pw.BorderRadius.all(pw.Radius.circular(4)),
                          ),
                          child: pw.Row(
                            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                            children: [
                              pw.Text(
                                "OUTSTANDING BALANCE:",
                                style: pw.TextStyle(
                                  fontSize: 8.5,
                                  fontWeight: pw.FontWeight.bold,
                                  color: PdfColors.white,
                                ),
                              ),
                              pw.Text(
                                "Rs. ${netBalance.toStringAsFixed(2)}",
                                style: pw.TextStyle(
                                  fontSize: 11,
                                  fontWeight: pw.FontWeight.bold,
                                  color: const PdfColor.fromInt(0xFFEAB308),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              pw.SizedBox(height: 24),

              // Footer Note
              pw.Divider(color: const PdfColor.fromInt(0xFFE2E8F0)),
              pw.SizedBox(height: 4),
              pw.Center(
                child: pw.Text(
                  "This is an official commercial statement from M.ASWATH HOLLOW BRICKS & LORRY SERVICES.",
                  style: const pw.TextStyle(fontSize: 7.5, color: PdfColor.fromInt(0xFF94A3B8)),
                ),
              ),
            ];
          },
        ),
      );

      final bytes = await pdf.save();

      // Write to Downloads folder
      final cleanName = customer.name.replaceAll(RegExp(r'[^\w\s]+'), '').replaceAll(' ', '_');
      final dateTag = "${startDate.year}${startDate.month.toString().padLeft(2, '0')}${startDate.day.toString().padLeft(2, '0')}";
      final fileName = "Statement_${cleanName}_$dateTag.pdf";

      File? savedFile;
      final targetDirs = [
        "/storage/emulated/0/Download",
        "/sdcard/Download",
      ];

      for (final dirPath in targetDirs) {
        try {
          final dir = Directory(dirPath);
          if (dir.existsSync()) {
            final f = File("$dirPath/$fileName");
            await f.writeAsBytes(bytes);
            savedFile = f;
            break;
          }
        } catch (_) {}
      }

      if (savedFile == null) {
        final tempFile = File("${Directory.systemTemp.path}/$fileName");
        await tempFile.writeAsBytes(bytes);
        savedFile = tempFile;
      }

      return StatementExportResult(
        success: true,
        filePath: savedFile.path,
        totalDebit: totalDebit,
        totalCredit: totalCredit,
        netBalance: netBalance,
        recordCount: inRange.length,
      );
    } catch (e) {
      return StatementExportResult(
        success: false,
        error: e.toString(),
      );
    }
  }
}

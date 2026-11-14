import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/models/cursor_model.dart';
import '../../core/services/cursor_service.dart';
import '../../core/services/fleet_service.dart';
import '../../core/services/stock_service.dart';
import '../../core/theme/app_colors.dart';

class CursorDetailPage extends StatefulWidget {
  final int cursorId;
  final String cursorName;

  const CursorDetailPage({
    super.key,
    required this.cursorId,
    required this.cursorName,
  });

  @override
  State<CursorDetailPage> createState() => _CursorDetailPageState();
}

class _CursorDetailPageState extends State<CursorDetailPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  CursorItem? _cursor;
  bool _isLoading = true;

  List<VehicleModel> _vehicles = [];
  List<StaffMember> _staff = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadAllData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAllData() async {
    setState(() => _isLoading = true);
    final results = await Future.wait([
      CursorService.getCursorById(widget.cursorId),
      FleetService.fetchVehicles(),
      StockService.fetchEmployees(),
    ]);

    if (!mounted) return;
    setState(() {
      _cursor = results[0] as CursorItem?;
      _vehicles = results[1] as List<VehicleModel>;
      _staff = results[2] as List<StaffMember>;
      _isLoading = false;
    });
  }

  // ─── RECORD VEHICLE LOADING MODAL ───
  void _openRecordLoadingModal() {
    if (_cursor == null) return;
    final products = _cursor!.products;

    CursorProductItem? selectedProd = products.isNotEmpty ? products.first : null;
    final prodNameCtrl = TextEditingController(text: selectedProd?.productName ?? "");
    final vehNumCtrl = TextEditingController();
    final driverNameCtrl = TextEditingController();
    final qtyCtrl = TextEditingController();
    final priceCtrl = TextEditingController();
    final loadChargeCtrl = TextEditingController(text: "0");
    bool hasLoadingCharge = false;
    String selectedCategory = selectedProd?.category ?? "sand";
    DateTime selectedDate = DateTime.now();
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalCtx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final qtyVal = double.tryParse(qtyCtrl.text.trim()) ?? 0.0;
          final priceVal = double.tryParse(priceCtrl.text.trim()) ?? 0.0;
          final chargeVal = hasLoadingCharge ? (double.tryParse(loadChargeCtrl.text.trim()) ?? 0.0) : 0.0;
          final totalCost = (qtyVal * priceVal) + (qtyVal * chargeVal);

          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(modalCtx).viewInsets.bottom,
            ),
            child: Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(modalCtx).size.height * 0.88,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    decoration: const BoxDecoration(
                      border: Border(bottom: BorderSide(color: AppColors.borderLight)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.local_shipping_rounded, color: AppColors.primary, size: 20),
                            ),
                            const SizedBox(width: 10),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "Record Vehicle Loading",
                                  style: GoogleFonts.outfit(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                Text(
                                  "At ${_cursor!.name} (Status: Loaded)",
                                  style: GoogleFonts.outfit(fontSize: 11, color: AppColors.textMuted),
                                ),
                              ],
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded, size: 20),
                          onPressed: () => Navigator.pop(modalCtx),
                        ),
                      ],
                    ),
                  ),

                  // Form Content
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Material selection
                          Text("SELECT MATERIAL *", style: _labelStyle),
                          const SizedBox(height: 6),
                          if (products.isNotEmpty) ...[
                            DropdownButtonFormField<CursorProductItem>(
                              value: selectedProd,
                              decoration: _inputDecoration("Pick material"),
                              items: products.map((p) {
                                return DropdownMenuItem(
                                  value: p,
                                  child: Text("${p.productName} (${p.category})", style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w600)),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) {
                                  setModalState(() {
                                    selectedProd = val;
                                    prodNameCtrl.text = val.productName;
                                    selectedCategory = val.category;
                                  });
                                }
                              },
                            ),
                          ] else ...[
                            TextFormField(
                              controller: prodNameCtrl,
                              decoration: _inputDecoration("e.g. M-Sand, Chips"),
                            ),
                          ],

                          const SizedBox(height: 14),

                          // Vehicle picker / input
                          Text("VEHICLE NUMBER *", style: _labelStyle),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: vehNumCtrl,
                                  textCapitalization: TextCapitalization.characters,
                                  decoration: _inputDecoration("e.g. TN39BR5668"),
                                  onChanged: (_) => setModalState(() {}),
                                ),
                              ),
                              if (_vehicles.isNotEmpty) ...[
                                const SizedBox(width: 8),
                                PopupMenuButton<VehicleModel>(
                                  icon: Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: AppColors.background,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: AppColors.border),
                                    ),
                                    child: const Icon(Icons.directions_bus_rounded, size: 18, color: AppColors.primary),
                                  ),
                                  onSelected: (veh) {
                                    setModalState(() {
                                      vehNumCtrl.text = veh.number;
                                    });
                                  },
                                  itemBuilder: (_) => _vehicles.map((v) {
                                    return PopupMenuItem(
                                      value: v,
                                      child: Text("${v.number} (${v.name})", style: GoogleFonts.outfit(fontSize: 12.5)),
                                    );
                                  }).toList(),
                                ),
                              ],
                            ],
                          ),

                          const SizedBox(height: 14),

                          // Driver picker / input
                          Text("DRIVER NAME *", style: _labelStyle),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: driverNameCtrl,
                                  decoration: _inputDecoration("e.g. Chinnasamy"),
                                  onChanged: (_) => setModalState(() {}),
                                ),
                              ),
                              if (_staff.isNotEmpty) ...[
                                const SizedBox(width: 8),
                                PopupMenuButton<StaffMember>(
                                  icon: Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: AppColors.background,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: AppColors.border),
                                    ),
                                    child: const Icon(Icons.person_rounded, size: 18, color: AppColors.primary),
                                  ),
                                  onSelected: (StaffMember emp) {
                                    setModalState(() {
                                      driverNameCtrl.text = emp.name;
                                    });
                                  },
                                  itemBuilder: (_) => _staff.map((s) {
                                    return PopupMenuItem<StaffMember>(
                                      value: s,
                                      child: Text(s.name, style: GoogleFonts.outfit(fontSize: 12.5)),
                                    );
                                  }).toList(),
                                ),
                              ],
                            ],
                          ),

                          const SizedBox(height: 14),

                          // Quantity & Buy Price
                          Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text("QUANTITY *", style: _labelStyle),
                                    const SizedBox(height: 6),
                                    TextFormField(
                                      controller: qtyCtrl,
                                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                      decoration: _inputDecoration("0"),
                                      onChanged: (_) => setModalState(() {}),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text("BUY PRICE / QTY (₹) *", style: _labelStyle),
                                    const SizedBox(height: 6),
                                    TextFormField(
                                      controller: priceCtrl,
                                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                      decoration: _inputDecoration("₹ 0"),
                                      onChanged: (_) => setModalState(() {}),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 14),

                          // Optional Loading Charge Box
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppColors.borderLight),
                            ),
                            child: Column(
                              children: [
                                Row(
                                  children: [
                                    Checkbox(
                                      value: hasLoadingCharge,
                                      activeColor: AppColors.primary,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                      onChanged: (val) {
                                        setModalState(() => hasLoadingCharge = val ?? false);
                                      },
                                    ),
                                    Expanded(
                                      child: Text(
                                        "Optional Loading Charge (Paid at Quarry)",
                                        style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                                      ),
                                    ),
                                  ],
                                ),
                                if (hasLoadingCharge) ...[
                                  const SizedBox(height: 8),
                                  TextFormField(
                                    controller: loadChargeCtrl,
                                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                    decoration: _inputDecoration("Loading Charge / Unit (₹)"),
                                    onChanged: (_) => setModalState(() {}),
                                  ),
                                ],
                              ],
                            ),
                          ),

                          const SizedBox(height: 16),

                          // Total Procurement Cost Live Banner
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF0F172A), Color(0xFF1E1B4B)],
                              ),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      "TOTAL PROCUREMENT PRICE",
                                      style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFFA5B4FC), letterSpacing: 0.5),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      "₹${totalCost.toStringAsFixed(2)}",
                                      style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white),
                                    ),
                                  ],
                                ),
                                Text(
                                  "${qtyVal.toStringAsFixed(1)} units",
                                  style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFFC7D2FE)),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 20),

                          // Submit Button
                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: ElevatedButton(
                              onPressed: isSaving
                                  ? null
                                  : () async {
                                      final pName = prodNameCtrl.text.trim();
                                      final vNum = vehNumCtrl.text.trim();
                                      final dName = driverNameCtrl.text.trim();
                                      final q = double.tryParse(qtyCtrl.text.trim()) ?? 0.0;
                                      final p = double.tryParse(priceCtrl.text.trim()) ?? 0.0;
                                      final c = hasLoadingCharge ? (double.tryParse(loadChargeCtrl.text.trim()) ?? 0.0) : 0.0;

                                      if (pName.isEmpty) {
                                        _showToast("Material name is required");
                                        return;
                                      }
                                      if (vNum.isEmpty) {
                                        _showToast("Vehicle number is required");
                                        return;
                                      }
                                      if (dName.isEmpty) {
                                        _showToast("Driver name is required");
                                        return;
                                      }
                                      if (q <= 0) {
                                        _showToast("Valid quantity is required");
                                        return;
                                      }

                                      setModalState(() => isSaving = true);
                                      final dateStr =
                                          "${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}";

                                      final res = await CursorService.createLoad(
                                        cursorId: _cursor!.id,
                                        cursorProductId: selectedProd?.id,
                                        productName: pName,
                                        category: selectedCategory,
                                        vehicleNumber: vNum,
                                        driverName: dName,
                                        qty: q,
                                        pricePerQty: p,
                                        hasLoadingCharge: hasLoadingCharge,
                                        loadingChargePerUnit: c,
                                        date: dateStr,
                                      );

                                      if (!modalCtx.mounted) return;
                                      if (res['success'] == true) {
                                        Navigator.pop(modalCtx);
                                        _showToast("Material load recorded with status 'loaded'!");
                                        _loadAllData();
                                      } else {
                                        setModalState(() => isSaving = false);
                                        _showToast(res['message']?.toString() ?? "Failed to save load");
                                      }
                                    },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
                              child: isSaving
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : Text("Confirm & Save Load", style: GoogleFonts.outfit(fontSize: 14.5, fontWeight: FontWeight.w700, color: Colors.white)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ─── RECORD PAYMENT MODAL ───
  void _openRecordPaymentModal() {
    if (_cursor == null) return;
    final amountCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    String paymentMode = "Cash";
    DateTime selectedDate = DateTime.now();
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalCtx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(modalCtx).viewInsets.bottom),
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Record Payment to Cursor", style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                      IconButton(icon: const Icon(Icons.close_rounded, size: 20), onPressed: () => Navigator.pop(modalCtx)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text("PAYMENT AMOUNT (₹) *", style: _labelStyle),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: amountCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: _inputDecoration("₹ 0.00"),
                  ),
                  const SizedBox(height: 14),
                  Text("PAYMENT MODE", style: _labelStyle),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: paymentMode,
                    decoration: _inputDecoration("Mode"),
                    items: const [
                      DropdownMenuItem(value: "Cash", child: Text("Cash")),
                      DropdownMenuItem(value: "Bank Transfer", child: Text("Bank Transfer / NEFT")),
                      DropdownMenuItem(value: "PhonePe", child: Text("PhonePe / UPI")),
                      DropdownMenuItem(value: "Google Pay", child: Text("Google Pay")),
                    ],
                    onChanged: (v) => setModalState(() => paymentMode = v ?? "Cash"),
                  ),
                  const SizedBox(height: 14),
                  Text("NOTES (OPTIONAL)", style: _labelStyle),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: notesCtrl,
                    decoration: _inputDecoration("e.g. Advance paid via UPI"),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: isSaving
                          ? null
                          : () async {
                              final amt = double.tryParse(amountCtrl.text.trim()) ?? 0.0;
                              if (amt <= 0) {
                                _showToast("Valid amount is required");
                                return;
                              }
                              setModalState(() => isSaving = true);
                              final dateStr =
                                  "${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}";

                              final res = await CursorService.createPayment(
                                cursorId: _cursor!.id,
                                amount: amt,
                                paymentMode: paymentMode,
                                date: dateStr,
                                notes: notesCtrl.text.trim(),
                              );

                              if (!modalCtx.mounted) return;
                              if (res['success'] == true) {
                                Navigator.pop(modalCtx);
                                _showToast("Payment recorded successfully!");
                                _loadAllData();
                              } else {
                                setModalState(() => isSaving = false);
                                _showToast(res['message']?.toString() ?? "Failed to save payment");
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: isSaving
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text("Confirm Payment", style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ─── ADD PRODUCT MODAL ───
  void _openAddProductModal() {
    if (_cursor == null) return;
    final nameCtrl = TextEditingController();
    String category = "sand";
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (dCtx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text("Add Product to Cursor", style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w800)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("PRODUCT NAME *", style: _labelStyle),
              const SizedBox(height: 6),
              TextFormField(controller: nameCtrl, decoration: _inputDecoration("e.g. M-Sand 6mm, Blue Metal")),
              const SizedBox(height: 12),
              Text("CATEGORY", style: _labelStyle),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: category,
                decoration: _inputDecoration("Category"),
                items: const [
                  DropdownMenuItem(value: "sand", child: Text("Sand / Dust")),
                  DropdownMenuItem(value: "cement", child: Text("Cement")),
                  DropdownMenuItem(value: "brick", child: Text("Brick / Blocks")),
                ],
                onChanged: (v) => setDialogState(() => category = v ?? "sand"),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dCtx),
              child: Text("Cancel", style: GoogleFonts.outfit(color: AppColors.textMuted)),
            ),
            ElevatedButton(
              onPressed: isSaving
                  ? null
                  : () async {
                      final pName = nameCtrl.text.trim();
                      if (pName.isEmpty) return;
                      setDialogState(() => isSaving = true);
                      final res = await CursorService.addProduct(
                        cursorId: _cursor!.id,
                        productName: pName,
                        category: category,
                      );
                      if (!dCtx.mounted) return;
                      if (res['success'] == true) {
                        Navigator.pop(dCtx);
                        _showToast("Product added to catalog");
                        _loadAllData();
                      } else {
                        setDialogState(() => isSaving = false);
                        _showToast(res['message']?.toString() ?? "Failed to add product");
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: isSaving
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text("Add", style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }

  void _showToast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: GoogleFonts.outfit(color: Colors.white)),
        backgroundColor: AppColors.textPrimary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  TextStyle get _labelStyle => GoogleFonts.outfit(
        fontSize: 10,
        fontWeight: FontWeight.w800,
        color: AppColors.textMuted,
        letterSpacing: 0.5,
      );

  InputDecoration _inputDecoration(String hint) => InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.outfit(fontSize: 13, color: AppColors.textMuted.withValues(alpha: 0.7)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
      );

  @override
  Widget build(BuildContext context) {
    final cur = _cursor;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          widget.cursorName,
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadAllData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : cur == null
              ? const Center(child: Text("Cursor not found"))
              : Column(
                  children: [
                    // Financial summary cards matching TPK ledger UI
                    Container(
                      color: Colors.white,
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              // Due balance
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFFF1F2),
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: const Color(0xFFFFE4E6)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        "CURRENT DUE BALANCE",
                                        style: GoogleFonts.outfit(fontSize: 9.5, fontWeight: FontWeight.w800, color: const Color(0xFFE11D48)),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        "₹${cur.currentDueBalance.toStringAsFixed(0)}",
                                        style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w900, color: const Color(0xFF881337)),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        "Live reconciled",
                                        style: GoogleFonts.outfit(fontSize: 10, color: const Color(0xFFE11D48)),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              // Turnover
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEEF2FF),
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: const Color(0xFFE0E7FF)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        "CURSOR TURNOVER",
                                        style: GoogleFonts.outfit(fontSize: 9.5, fontWeight: FontWeight.w800, color: AppColors.primary),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        "₹${cur.totalProcurementAmount.toStringAsFixed(0)}",
                                        style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w900, color: const Color(0xFF1E1B4B)),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        "${cur.loads.length} loads • ${cur.payments.length} payments",
                                        style: GoogleFonts.outfit(fontSize: 10, color: AppColors.primary),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 12),

                          // Quick Action Buttons
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: _openRecordLoadingModal,
                                  icon: const Icon(Icons.add_rounded, size: 16),
                                  label: const Text("+ Loading"),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: _openRecordPaymentModal,
                                  icon: const Icon(Icons.payment_rounded, size: 16),
                                  label: const Text("Pay Cursor"),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.success,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              IconButton(
                                onPressed: _openAddProductModal,
                                icon: const Icon(Icons.category_rounded, color: AppColors.primary),
                                tooltip: "Add Product",
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Tab bar
                    Container(
                      color: Colors.white,
                      child: TabBar(
                        controller: _tabController,
                        indicatorColor: AppColors.primary,
                        labelColor: AppColors.primary,
                        unselectedLabelColor: AppColors.textMuted,
                        labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 12),
                        isScrollable: true,
                        tabs: [
                          Tab(text: "All Records (${cur.loads.length + cur.payments.length})"),
                          Tab(text: "Loads (${cur.loads.length})"),
                          Tab(text: "Payments (${cur.payments.length})"),
                          Tab(text: "Products (${cur.products.length})"),
                        ],
                      ),
                    ),

                    // Tab Views
                    Expanded(
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          // Tab 1: All Records
                          _buildAllRecordsList(cur),
                          // Tab 2: Vehicle Loads
                          _buildLoadsList(cur.loads),
                          // Tab 3: Payments
                          _buildPaymentsList(cur.payments),
                          // Tab 4: Products
                          _buildProductsList(cur.products),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildAllRecordsList(CursorItem cur) {
    final List<Map<String, dynamic>> combined = [];
    for (final l in cur.loads) {
      combined.add({
        'type': 'load',
        'date': l.date,
        'title': l.productName,
        'subtitle': 'Vehicle: ${l.vehicleNumber} • Driver: ${l.driverName} • ${l.qty} units',
        'amount': l.totalProcurementCost,
        'isDebit': true,
      });
    }
    for (final p in cur.payments) {
      combined.add({
        'type': 'payment',
        'date': p.date,
        'title': 'Payment Paid (${p.paymentMode})',
        'subtitle': p.notes.isNotEmpty ? p.notes : 'Payment Settlement',
        'amount': p.amount,
        'isDebit': false,
      });
    }

    combined.sort((a, b) => (b['date'] as String).compareTo(a['date'] as String));

    if (combined.isEmpty) {
      return const Center(child: Text("No records found"));
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: combined.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (ctx, i) {
        final item = combined[i];
        final isDebit = item['isDebit'] as bool;
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isDebit ? const Color(0xFFFFF1F2) : const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isDebit ? Icons.local_shipping_rounded : Icons.check_circle_rounded,
                  size: 18,
                  color: isDebit ? const Color(0xFFE11D48) : const Color(0xFF16A34A),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item['title'] as String, style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 13.5)),
                    Text(item['subtitle'] as String, style: GoogleFonts.outfit(color: AppColors.textMuted, fontSize: 11)),
                    Text(item['date'] as String, style: GoogleFonts.outfit(color: AppColors.textMuted.withValues(alpha: 0.7), fontSize: 10)),
                  ],
                ),
              ),
              Text(
                "${isDebit ? '+' : '-'} ₹${(item['amount'] as double).toStringAsFixed(0)}",
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                  color: isDebit ? const Color(0xFFE11D48) : const Color(0xFF16A34A),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLoadsList(List<CursorLoadItem> loads) {
    if (loads.isEmpty) return const Center(child: Text("No vehicle loads recorded yet"));
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: loads.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (ctx, i) {
        final l = loads[i];
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(l.productName, style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 14)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: l.status == 'loaded' ? const Color(0xFFFEF3C7) : const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      l.status == 'loaded' ? "Ready to Dispatch" : "Delivered",
                      style: GoogleFonts.outfit(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: l.status == 'loaded' ? const Color(0xFFD97706) : const Color(0xFF16A34A),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text("Vehicle: ${l.vehicleNumber} • Driver: ${l.driverName}", style: GoogleFonts.outfit(fontSize: 11.5, color: AppColors.textMuted)),
              Text("Qty: ${l.qty} (Remaining: ${l.remainingQty}) • Rate: ₹${l.pricePerQty}/unit", style: GoogleFonts.outfit(fontSize: 11.5, color: AppColors.textMuted)),
              if (l.hasLoadingCharge)
                Text("Quarry Loading Charge: ₹${l.loadingChargePerUnit}/unit", style: GoogleFonts.outfit(fontSize: 11, color: AppColors.primary)),
              const Divider(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(l.date, style: GoogleFonts.outfit(fontSize: 11, color: AppColors.textMuted)),
                  Text("Total: ₹${l.totalProcurementCost.toStringAsFixed(0)}", style: GoogleFonts.outfit(fontSize: 13.5, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPaymentsList(List<CursorPaymentItem> payments) {
    if (payments.isEmpty) return const Center(child: Text("No payments recorded yet"));
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: payments.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (ctx, i) {
        final p = payments[i];
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Paid via ${p.paymentMode}", style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 13)),
                  Text(p.date, style: GoogleFonts.outfit(fontSize: 11, color: AppColors.textMuted)),
                  if (p.notes.isNotEmpty) Text(p.notes, style: GoogleFonts.outfit(fontSize: 10.5, color: AppColors.textMuted)),
                ],
              ),
              Text("₹${p.amount.toStringAsFixed(0)}", style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.w800, color: const Color(0xFF16A34A))),
            ],
          ),
        );
      },
    );
  }

  Widget _buildProductsList(List<CursorProductItem> products) {
    if (products.isEmpty) return const Center(child: Text("No materials in catalog yet"));
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: products.length,
      separatorBuilder: (_, _) => const SizedBox(height: 8),
      itemBuilder: (ctx, i) {
        final prod = products[i];
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.category_rounded, size: 18, color: AppColors.primary),
                  const SizedBox(width: 10),
                  Text(prod.productName, style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 13.5)),
                ],
              ),
              Text(prod.category.toUpperCase(), style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.textMuted)),
            ],
          ),
        );
      },
    );
  }
}

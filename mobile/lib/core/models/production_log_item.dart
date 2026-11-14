import 'dart:convert';

class RawMaterialSnapshot {
  final int? materialProductId;
  final String materialName;
  final String unit;
  final bool isCement;
  final double standardQty;
  final double actualQty;
  final double variance;
  final String varianceStatus;

  RawMaterialSnapshot({
    this.materialProductId,
    required this.materialName,
    required this.unit,
    required this.isCement,
    required this.standardQty,
    required this.actualQty,
    required this.variance,
    required this.varianceStatus,
  });

  factory RawMaterialSnapshot.fromJson(Map<String, dynamic> json) {
    return RawMaterialSnapshot(
      materialProductId: json['material_product_id'] != null
          ? int.tryParse(json['material_product_id'].toString())
          : null,
      materialName: (json['material_name'] ?? 'Material').toString(),
      unit: (json['unit'] ?? 'Units').toString(),
      isCement: json['is_cement'] == true,
      standardQty: double.tryParse(json['standard_qty']?.toString() ?? '0') ?? 0.0,
      actualQty: double.tryParse(json['actual_qty']?.toString() ?? '0') ?? 0.0,
      variance: double.tryParse(json['variance']?.toString() ?? '0') ?? 0.0,
      varianceStatus: (json['variance_status'] ?? 'OPTIMAL').toString(),
    );
  }
}

class ProductionLogItem {
  final int id;
  final String date;
  final String officeName;
  final int officeId;
  final String productName;
  final int productId;
  final double unitProduced;
  final double cementUsed;
  final String cementProductName;
  final int numberOfStocks;
  final double pricePerStock;
  final List<String> employeeNames;
  final List<RawMaterialSnapshot> rawMaterialsUsed;

  ProductionLogItem({
    required this.id,
    required this.date,
    required this.officeName,
    required this.officeId,
    required this.productName,
    required this.productId,
    required this.unitProduced,
    required this.cementUsed,
    required this.cementProductName,
    required this.numberOfStocks,
    required this.pricePerStock,
    required this.employeeNames,
    required this.rawMaterialsUsed,
  });

  double get totalWage => numberOfStocks * pricePerStock;

  double get bricksPerStock =>
      numberOfStocks > 0 ? unitProduced / numberOfStocks : 0.0;

  double get wagePerPerson =>
      employeeNames.isNotEmpty ? totalWage / employeeNames.length : totalWage;

  String get formattedDate {
    try {
      final parts = date.split('T').first.split('-');
      if (parts.length == 3) {
        final year = parts[0];
        final monthIdx = int.tryParse(parts[1]) ?? 1;
        final day = parts[2].padLeft(2, '0');
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        final monthStr = (monthIdx >= 1 && monthIdx <= 12) ? months[monthIdx - 1] : parts[1];
        return '$day $monthStr $year';
      }
    } catch (_) {}
    return date;
  }

  factory ProductionLogItem.fromJson(Map<String, dynamic> json) {
    final office = json['office'] as Map<String, dynamic>? ?? {};
    final product = json['product'] as Map<String, dynamic>? ?? {};
    final cementProduct = json['cementProduct'] as Map<String, dynamic>? ?? {};

    String offName = (office['office_name'] ?? json['office_name'] ?? 'Office').toString().trim();
    if (offName.toLowerCase() == 'thoom') {
      offName = 'Thottam';
    }

    // Extract employee names
    final List<String> staff = [];
    final rawEmps = json['employees'];
    if (rawEmps is List) {
      for (final e in rawEmps) {
        if (e is Map) {
          final empObj = e['employee'] as Map<String, dynamic>?;
          final name = (empObj?['name'] ?? e['name'] ?? '').toString().trim();
          if (name.isNotEmpty) staff.add(name);
        }
      }
    }

    // Extract raw materials used
    final List<RawMaterialSnapshot> mats = [];
    dynamic rawMats = json['raw_materials_used'];
    if (rawMats is String) {
      try {
        rawMats = jsonDecode(rawMats);
      } catch (_) {}
    }
    if (rawMats is List) {
      for (final m in rawMats) {
        if (m is Map<String, dynamic>) {
          mats.add(RawMaterialSnapshot.fromJson(m));
        } else if (m is Map) {
          mats.add(RawMaterialSnapshot.fromJson(Map<String, dynamic>.from(m)));
        }
      }
    }

    final id = int.tryParse(json['production_id']?.toString() ?? json['id']?.toString() ?? '0') ?? 0;
    final offId = int.tryParse(json['office_id']?.toString() ?? office['office_id']?.toString() ?? '1') ?? 1;
    final pId = int.tryParse(json['product_id']?.toString() ?? product['product_id']?.toString() ?? '0') ?? 0;
    final units = double.tryParse(json['unit_produced']?.toString() ?? '0') ?? 0.0;
    final cement = double.tryParse(json['cement_used']?.toString() ?? '0') ?? 0.0;
    final stocks = int.tryParse(json['number_of_stocks']?.toString() ?? '0') ?? 0;
    final price = double.tryParse(json['price_per_stock']?.toString() ?? '0') ?? 0.0;
    final dateStr = (json['production_date'] ?? json['date'] ?? '').toString();

    return ProductionLogItem(
      id: id,
      date: dateStr,
      officeName: offName,
      officeId: offId,
      productName: (product['product_name'] ?? json['product_name'] ?? 'Brick Product').toString().trim(),
      productId: pId,
      unitProduced: units,
      cementUsed: cement,
      cementProductName: (cementProduct['product_name'] ?? 'OPC 53 Grade').toString().trim(),
      numberOfStocks: stocks,
      pricePerStock: price,
      employeeNames: staff,
      rawMaterialsUsed: mats,
    );
  }
}

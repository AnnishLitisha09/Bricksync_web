class CursorProductItem {
  final int id;
  final int cursorId;
  final String productName;
  final String category;

  CursorProductItem({
    required this.id,
    required this.cursorId,
    required this.productName,
    this.category = 'sand',
  });

  factory CursorProductItem.fromJson(Map<String, dynamic> json) {
    return CursorProductItem(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      cursorId: json['cursor_id'] is int
          ? json['cursor_id']
          : int.tryParse(json['cursor_id']?.toString() ?? '0') ?? 0,
      productName: json['product_name']?.toString() ?? '',
      category: json['category']?.toString() ?? 'sand',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'cursor_id': cursorId,
        'product_name': productName,
        'category': category,
      };
}

class CursorLoadItem {
  final int id;
  final int cursorId;
  final int? cursorProductId;
  final String productName;
  final String category;
  final int? vehicleId;
  final String vehicleNumber;
  final int? driverId;
  final String driverName;
  final double qty;
  final double remainingQty;
  final double pricePerQty;
  final bool hasLoadingCharge;
  final double loadingChargePerUnit;
  final String status; // 'loaded', 'delivered', 'cancelled'
  final int? customerId;
  final String customerName;
  final String date;
  final String notes;
  final String cursorName;

  CursorLoadItem({
    required this.id,
    required this.cursorId,
    this.cursorProductId,
    required this.productName,
    this.category = 'sand',
    this.vehicleId,
    required this.vehicleNumber,
    this.driverId,
    required this.driverName,
    required this.qty,
    required this.remainingQty,
    required this.pricePerQty,
    this.hasLoadingCharge = false,
    this.loadingChargePerUnit = 0.0,
    this.status = 'loaded',
    this.customerId,
    this.customerName = '',
    required this.date,
    this.notes = '',
    this.cursorName = '',
  });

  double get totalLoadingCharge => hasLoadingCharge ? qty * loadingChargePerUnit : 0.0;
  double get baseCost => qty * pricePerQty;
  double get totalProcurementCost => baseCost + totalLoadingCharge;

  factory CursorLoadItem.fromJson(Map<String, dynamic> json) {
    final cName = json['cursor'] != null && json['cursor'] is Map
        ? json['cursor']['name']?.toString() ?? ''
        : json['cursor_name']?.toString() ?? '';

    return CursorLoadItem(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      cursorId: json['cursor_id'] is int
          ? json['cursor_id']
          : int.tryParse(json['cursor_id']?.toString() ?? '0') ?? 0,
      cursorProductId: json['cursor_product_id'] != null
          ? int.tryParse(json['cursor_product_id'].toString())
          : null,
      productName: json['product_name']?.toString() ?? '',
      category: json['category']?.toString() ?? 'sand',
      vehicleId: json['vehicle_id'] != null
          ? int.tryParse(json['vehicle_id'].toString())
          : null,
      vehicleNumber: json['vehicle_number']?.toString() ?? '',
      driverId: json['driver_id'] != null
          ? int.tryParse(json['driver_id'].toString())
          : null,
      driverName: json['driver_name']?.toString() ?? '',
      qty: (json['qty'] is num ? (json['qty'] as num).toDouble() : double.tryParse(json['qty']?.toString() ?? '0') ?? 0.0),
      remainingQty: (json['remaining_qty'] is num
          ? (json['remaining_qty'] as num).toDouble()
          : double.tryParse(json['remaining_qty']?.toString() ?? '0') ?? 0.0),
      pricePerQty: (json['price_per_qty'] is num
          ? (json['price_per_qty'] as num).toDouble()
          : double.tryParse(json['price_per_qty']?.toString() ?? '0') ?? 0.0),
      hasLoadingCharge: json['has_loading_charge'] == true || json['has_loading_charge'] == 1,
      loadingChargePerUnit: (json['loading_charge_per_unit'] is num
          ? (json['loading_charge_per_unit'] as num).toDouble()
          : double.tryParse(json['loading_charge_per_unit']?.toString() ?? '0') ?? 0.0),
      status: json['status']?.toString() ?? 'loaded',
      customerId: json['customer_id'] != null
          ? int.tryParse(json['customer_id'].toString())
          : null,
      customerName: json['customer_name']?.toString() ?? '',
      date: json['date']?.toString() ?? '',
      notes: json['notes']?.toString() ?? '',
      cursorName: cName,
    );
  }
}

class CursorPaymentItem {
  final int id;
  final int cursorId;
  final double amount;
  final String paymentMode;
  final int? bankId;
  final String date;
  final String notes;

  CursorPaymentItem({
    required this.id,
    required this.cursorId,
    required this.amount,
    this.paymentMode = 'Cash',
    this.bankId,
    required this.date,
    this.notes = '',
  });

  factory CursorPaymentItem.fromJson(Map<String, dynamic> json) {
    return CursorPaymentItem(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      cursorId: json['cursor_id'] is int
          ? json['cursor_id']
          : int.tryParse(json['cursor_id']?.toString() ?? '0') ?? 0,
      amount: (json['amount'] is num ? (json['amount'] as num).toDouble() : double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0),
      paymentMode: json['payment_mode']?.toString() ?? 'Cash',
      bankId: json['bank_id'] != null ? int.tryParse(json['bank_id'].toString()) : null,
      date: json['date']?.toString() ?? '',
      notes: json['notes']?.toString() ?? '',
    );
  }
}

class CursorItem {
  final int id;
  final String name;
  final String location;
  final String phone;
  final String notes;
  final int productsCount;
  final int readyToDeliverCount;
  final int totalLoadsCount;
  final List<CursorProductItem> products;
  final List<CursorLoadItem> loads;
  final List<CursorPaymentItem> payments;

  CursorItem({
    required this.id,
    required this.name,
    this.location = '',
    this.phone = '',
    this.notes = '',
    this.productsCount = 0,
    this.readyToDeliverCount = 0,
    this.totalLoadsCount = 0,
    this.products = const [],
    this.loads = const [],
    this.payments = const [],
  });

  double get totalProcurementAmount {
    return loads.fold(0.0, (sum, l) => sum + l.totalProcurementCost);
  }

  double get totalPaidAmount {
    return payments.fold(0.0, (sum, p) => sum + p.amount);
  }

  double get currentDueBalance {
    return totalProcurementAmount - totalPaidAmount;
  }

  factory CursorItem.fromJson(Map<String, dynamic> json) {
    final rawProds = json['products'] as List? ?? [];
    final prods = rawProds.map((p) => CursorProductItem.fromJson(p as Map<String, dynamic>)).toList();

    final rawLoads = json['loads'] as List? ?? [];
    final lds = rawLoads.map((l) => CursorLoadItem.fromJson(l as Map<String, dynamic>)).toList();

    final rawPayments = json['payments'] as List? ?? [];
    final pymts = rawPayments.map((p) => CursorPaymentItem.fromJson(p as Map<String, dynamic>)).toList();

    final pCount = json['productsCount'] is int
        ? json['productsCount'] as int
        : (json['_count'] != null && json['_count']['products'] is int
            ? json['_count']['products'] as int
            : prods.length);

    final readyCount = json['readyToDeliverCount'] is int
        ? json['readyToDeliverCount'] as int
        : lds.where((l) => l.status == 'loaded' && l.remainingQty > 0).length;

    final totalLCount = json['totalLoadsCount'] is int
        ? json['totalLoadsCount'] as int
        : lds.length;

    return CursorItem(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      name: json['name']?.toString() ?? '',
      location: json['location']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      notes: json['notes']?.toString() ?? '',
      productsCount: pCount,
      readyToDeliverCount: readyCount,
      totalLoadsCount: totalLCount,
      products: prods,
      loads: lds,
      payments: pymts,
    );
  }
}

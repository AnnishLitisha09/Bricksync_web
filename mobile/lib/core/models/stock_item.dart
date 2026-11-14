class StockItem {
  final int id; // stock_id
  final int productId; // product_id for "PROD-$productId"
  final String productName;
  final String category;
  final String officeName; // "Office" or "Thottam"
  final int officeId; // 1: Office, 2: Thottam
  final double quantity;
  final String formattedQuantity; // "5.00", "400.00", "2500.00"
  final String unit; // "NOS", "UNITS", "BAGS"
  final double price;
  final double pricePerStock;
  final String description;
  final String imageUrl;

  StockItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.category,
    required this.officeName,
    required this.officeId,
    required this.quantity,
    required this.formattedQuantity,
    this.unit = "NOS",
    this.price = 0.0,
    this.pricePerStock = 0.0,
    this.description = "",
    this.imageUrl = "",
  });

  bool get isOutOfStock => quantity <= 0.0;
  bool get isLowStock => quantity > 0.0 && quantity < 10.0;
  bool get isHealthyStock => quantity >= 10.0;

  String get statusText {
    if (isOutOfStock) return "OUT OF STOCK";
    return "$formattedQuantity $unit";
  }

  static String getUnitForCategory(String category) {
    final cat = category.toLowerCase().trim();
    if (cat.contains("cement")) {
      return "BAGS";
    } else if (cat.contains("sand") || cat.contains("raw") || cat.contains("stone") || cat.contains("aggregate")) {
      return "UNITS";
    }
    return "NOS";
  }

  factory StockItem.fromJson(Map<String, dynamic> json) {
    final product = json['product'] as Map<String, dynamic>? ?? {};
    final office = json['office'] as Map<String, dynamic>? ?? {};

    final cat = (product['category'] ?? json['category'] ?? 'bricks').toString().trim();
    final unit = getUnitForCategory(cat);

    // Parse quantity handling decimal strings like "5.00", "400.00"
    final rawQty = json['quantity'];
    double qty = 0.0;
    String formatted = "0.00";
    if (rawQty != null) {
      if (rawQty is num) {
        qty = rawQty.toDouble();
        formatted = qty.toStringAsFixed(2);
      } else {
        final str = rawQty.toString().trim();
        qty = double.tryParse(str) ?? 0.0;
        if (str.contains('.')) {
          formatted = str;
        } else {
          formatted = qty.toStringAsFixed(2);
        }
      }
    }

    // Office name: normalize "thoom" to "Thottam"
    String offName = (office['office_name'] ?? json['office_name'] ?? 'Office').toString().trim();
    if (offName.toLowerCase() == "thoom") {
      offName = "Thottam";
    }

    final pId = int.tryParse(product['product_id']?.toString() ?? '') ??
        int.tryParse(json['product_id']?.toString() ?? '') ??
        int.tryParse(json['stock_id']?.toString() ?? '') ??
        0;

    final sId = int.tryParse(json['stock_id']?.toString() ?? '') ??
        int.tryParse(json['id']?.toString() ?? '') ??
        0;

    final offId = int.tryParse(json['office_id']?.toString() ?? '') ??
        int.tryParse(office['office_id']?.toString() ?? '') ??
        1;

    final pps = double.tryParse(product['price_per_stock']?.toString() ?? json['price_per_stock']?.toString() ?? '0') ?? 0.0;

    return StockItem(
      id: sId,
      productId: pId,
      productName: (product['product_name'] ?? json['product_name'] ?? 'Product').toString().trim(),
      category: cat.toLowerCase(),
      officeName: offName,
      officeId: offId,
      quantity: qty,
      formattedQuantity: formatted,
      unit: unit,
      price: double.tryParse(json['price']?.toString() ?? '0.0') ?? 0.0,
      pricePerStock: pps,
      description: (product['description'] ?? '').toString(),
      imageUrl: (product['image_url'] ?? '').toString(),
    );
  }
}

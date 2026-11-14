import '../models/cursor_model.dart';
import 'api_client.dart';

class CursorService {
  /// Fetch all cursors (quarries)
  static Future<List<CursorItem>> getAllCursors() async {
    try {
      final res = await ApiClient.get('/cursors');
      if (res.isSuccess && res.data != null) {
        final List list = res.data is List ? res.data as List : (res.data['data'] as List? ?? []);
        return list.map((c) => CursorItem.fromJson(Map<String, dynamic>.from(c as Map))).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  /// Fetch active loaded materials ready for dispatch
  static Future<List<CursorLoadItem>> getLoadedMaterials() async {
    try {
      final res = await ApiClient.get('/cursors/loaded-materials');
      if (res.isSuccess && res.data != null) {
        final List list = res.data is List ? res.data as List : (res.data['data'] as List? ?? []);
        return list.map((l) => CursorLoadItem.fromJson(Map<String, dynamic>.from(l as Map))).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  /// Fetch single cursor detail with products, loads, and payments
  static Future<CursorItem?> getCursorById(int id) async {
    try {
      final res = await ApiClient.get('/cursors/$id');
      if (res.isSuccess && res.data != null) {
        final data = res.data is Map ? (res.data['data'] ?? res.data) : null;
        if (data != null && data is Map) {
          return CursorItem.fromJson(Map<String, dynamic>.from(data));
        }
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Create a new Cursor
  static Future<Map<String, dynamic>> createCursor({
    required String name,
    String location = '',
    String phone = '',
    String notes = '',
  }) async {
    final body = {
      'name': name.trim(),
      'location': location.trim(),
      'phone': phone.trim(),
      'notes': notes.trim(),
    };
    final res = await ApiClient.post('/cursors', body);
    if (res.isSuccess) {
      return {'success': true, 'data': res.data};
    }
    return {'success': false, 'message': res.error ?? 'Failed to create cursor'};
  }

  /// Add a product to Cursor catalog
  static Future<Map<String, dynamic>> addProduct({
    required int cursorId,
    required String productName,
    String category = 'sand',
  }) async {
    final body = {
      'product_name': productName.trim(),
      'category': category.toLowerCase().trim(),
    };
    final res = await ApiClient.post('/cursors/$cursorId/products', body);
    if (res.isSuccess) {
      return {'success': true, 'data': res.data};
    }
    return {'success': false, 'message': res.error ?? 'Failed to add product'};
  }

  /// Delete product from catalog
  static Future<bool> deleteProduct(int productId) async {
    final res = await ApiClient.delete('/cursors/products/$productId');
    return res.isSuccess;
  }

  /// Record vehicle loading at quarry
  static Future<Map<String, dynamic>> createLoad({
    required int cursorId,
    int? cursorProductId,
    required String productName,
    String category = 'sand',
    int? vehicleId,
    required String vehicleNumber,
    int? driverId,
    required String driverName,
    required double qty,
    required double pricePerQty,
    bool hasLoadingCharge = false,
    double loadingChargePerUnit = 0.0,
    String? customerName,
    required String date,
    String notes = '',
  }) async {
    final body = {
      if (cursorProductId != null && cursorProductId > 0) 'cursor_product_id': cursorProductId,
      'product_name': productName.trim(),
      'category': category.toLowerCase().trim(),
      if (vehicleId != null && vehicleId > 0) 'vehicle_id': vehicleId,
      'vehicle_number': vehicleNumber.trim(),
      if (driverId != null && driverId > 0) 'driver_id': driverId,
      'driver_name': driverName.trim(),
      'qty': qty,
      'price_per_qty': pricePerQty,
      'has_loading_charge': hasLoadingCharge,
      'loading_charge_per_unit': hasLoadingCharge ? loadingChargePerUnit : 0.0,
      if (customerName != null && customerName.trim().isNotEmpty) 'customer_name': customerName.trim(),
      'date': date,
      'notes': notes.trim(),
    };

    final res = await ApiClient.post('/cursors/$cursorId/loads', body);
    if (res.isSuccess) {
      return {'success': true, 'data': res.data};
    }
    return {'success': false, 'message': res.error ?? 'Failed to record load'};
  }

  /// Record payment to Cursor
  static Future<Map<String, dynamic>> createPayment({
    required int cursorId,
    required double amount,
    String paymentMode = 'Cash',
    int? bankId,
    required String date,
    String notes = '',
  }) async {
    final body = {
      'amount': amount,
      'payment_mode': paymentMode,
      if (bankId != null && bankId > 0) 'bank_id': bankId,
      'date': date,
      'notes': notes.trim(),
    };

    final res = await ApiClient.post('/cursors/$cursorId/payments', body);
    if (res.isSuccess) {
      return {'success': true, 'data': res.data};
    }
    return {'success': false, 'message': res.error ?? 'Failed to record payment'};
  }
}

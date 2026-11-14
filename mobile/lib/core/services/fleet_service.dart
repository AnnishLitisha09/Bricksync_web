import 'api_client.dart';

class VehicleModel {
  final int id;
  final String name;
  final String number;
  final String kilometer;
  final bool isActive;
  final double totalCost;

  VehicleModel({
    required this.id,
    required this.name,
    required this.number,
    required this.kilometer,
    required this.isActive,
    this.totalCost = 0.0,
  });

  factory VehicleModel.fromJson(Map<String, dynamic> json) {
    return VehicleModel(
      id: int.tryParse((json['id'] ?? '0').toString()) ?? 0,
      name: (json['vehicleName'] ?? json['name'] ?? 'Vehicle').toString().trim(),
      number: (json['vehicleNumber'] ?? json['number'] ?? '').toString().trim(),
      kilometer: (json['kilometer'] ?? '0').toString().trim(),
      isActive: json['isActive'] == true || json['isActive'] == 1 || json['isActive'] == '1',
      totalCost: double.tryParse((json['totalCost'] ?? '0').toString()) ?? 0.0,
    );
  }
}

class FleetService {
  static List<VehicleModel> _vehicles = [];
  static int _totalOrders = 0;

  static List<VehicleModel> get currentVehicles => _vehicles;
  static int get activeVehiclesCount => _vehicles.where((v) => v.isActive).length;
  static int get totalOrdersCount => _totalOrders;

  /// Fetches vehicles list from backend: /api/vehicles
  static Future<List<VehicleModel>> fetchVehicles() async {
    try {
      final res = await ApiClient.get('/vehicles');
      if (res.isSuccess && res.data != null) {
        final dynamic raw = res.data;
        List? list;
        if (raw is List) {
          list = raw;
        } else if (raw is Map && raw['data'] is List) {
          list = raw['data'] as List;
        }

        if (list != null) {
          _vehicles = list
              .map((item) => VehicleModel.fromJson(Map<String, dynamic>.from(item)))
              .toList();
          return _vehicles;
        }
      }
    } catch (_) {}
    return _vehicles;
  }

  /// Fetches total orders count from backend: /api/orders
  static Future<int> fetchOrdersCount() async {
    try {
      final res = await ApiClient.get('/orders?limit=1');
      if (res.isSuccess && res.data != null) {
        final dynamic raw = res.data;
        if (raw is Map && raw['pagination'] != null && raw['pagination']['total'] != null) {
          _totalOrders = int.tryParse(raw['pagination']['total'].toString()) ?? _totalOrders;
          return _totalOrders;
        } else if (raw is List) {
          _totalOrders = raw.length;
          return _totalOrders;
        }
      }
      // If no pagination, fetch all
      final allRes = await ApiClient.get('/orders');
      if (allRes.isSuccess && allRes.data != null) {
        final dynamic raw = allRes.data;
        if (raw is List) {
          _totalOrders = raw.length;
        } else if (raw is Map && raw['data'] is List) {
          _totalOrders = (raw['data'] as List).length;
        }
      }
    } catch (_) {}
    return _totalOrders;
  }

  /// Returns comma separated summary of active truck plates (e.g. "TN39BL1288, TN39CK1288")
  static String get activeVehiclePlatesSummary {
    final active = _vehicles.where((v) => v.isActive && v.number.isNotEmpty).map((v) => v.number).take(2).toList();
    if (active.isEmpty) return "Fleet online";
    return active.join(", ");
  }
}

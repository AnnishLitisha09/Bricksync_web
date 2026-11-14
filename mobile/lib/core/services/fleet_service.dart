import 'api_client.dart';

String formatFleetDate(String? raw) {
  if (raw == null || raw.isEmpty) return "Not Set";
  try {
    final dt = DateTime.parse(raw);
    final day = dt.day.toString().padLeft(2, '0');
    final month = dt.month.toString().padLeft(2, '0');
    final year = dt.year.toString();
    return "$day-$month-$year";
  } catch (_) {
    return raw;
  }
}

class VehicleModel {
  final int id;
  final String name;
  final String number;
  final String kilometer;
  final bool isActive;
  final String? insurance;
  final String? pollution;
  final String? rcDate;
  final String? speedGovernor;
  final String? vehicleImage;
  final double totalFuel;
  final double totalService;
  final double totalSpares;
  final double totalCost;

  VehicleModel({
    required this.id,
    required this.name,
    required this.number,
    required this.kilometer,
    required this.isActive,
    this.insurance,
    this.pollution,
    this.rcDate,
    this.speedGovernor,
    this.vehicleImage,
    this.totalFuel = 0.0,
    this.totalService = 0.0,
    this.totalSpares = 0.0,
    this.totalCost = 0.0,
  });

  bool get isInsuranceExpired {
    if (insurance == null || insurance!.isEmpty) return false;
    try {
      final d = DateTime.parse(insurance!);
      final today = DateTime.now();
      return DateTime(d.year, d.month, d.day).isBefore(DateTime(today.year, today.month, today.day));
    } catch (_) {
      return false;
    }
  }

  bool get isPollutionExpired {
    if (pollution == null || pollution!.isEmpty) return false;
    try {
      final d = DateTime.parse(pollution!);
      final today = DateTime.now();
      return DateTime(d.year, d.month, d.day).isBefore(DateTime(today.year, today.month, today.day));
    } catch (_) {
      return false;
    }
  }

  bool get isRcExpired {
    if (rcDate == null || rcDate!.isEmpty) return false;
    try {
      final d = DateTime.parse(rcDate!);
      final today = DateTime.now();
      return DateTime(d.year, d.month, d.day).isBefore(DateTime(today.year, today.month, today.day));
    } catch (_) {
      return false;
    }
  }

  String get formattedInsurance => formatFleetDate(insurance);
  String get formattedPollution => formatFleetDate(pollution);
  String get formattedRcDate => formatFleetDate(rcDate);

  factory VehicleModel.fromJson(Map<String, dynamic> json) {
    final double fuel = double.tryParse((json['totalFuel'] ?? '0').toString()) ?? 0.0;
    final double service = double.tryParse((json['totalService'] ?? '0').toString()) ?? 0.0;
    final double spares = double.tryParse((json['totalSpares'] ?? '0').toString()) ?? 0.0;
    final double cost = double.tryParse((json['totalCost'] ?? '0').toString()) ?? (fuel + service + spares);

    return VehicleModel(
      id: int.tryParse((json['id'] ?? '0').toString()) ?? 0,
      name: (json['vehicleName'] ?? json['name'] ?? 'Vehicle').toString().trim(),
      number: (json['vehicleNumber'] ?? json['number'] ?? '').toString().trim(),
      kilometer: (json['kilometer'] ?? '0').toString().trim(),
      isActive: json['isActive'] == true || json['isActive'] == 1 || json['isActive'] == '1',
      insurance: json['insurance']?.toString(),
      pollution: json['pollution']?.toString(),
      rcDate: json['rcDate']?.toString(),
      speedGovernor: json['speedGovernor']?.toString(),
      vehicleImage: json['vehicleImage']?.toString(),
      totalFuel: fuel,
      totalService: service,
      totalSpares: spares,
      totalCost: cost,
    );
  }
}

class FuelRecordModel {
  final int fuelId;
  final int vehicleId;
  final int bunkId;
  final String vehicleName;
  final String vehicleNumber;
  final String bunkName;
  final double volume;
  final double amount;
  final String date;
  final String kilometer;
  final bool isVerified;

  FuelRecordModel({
    required this.fuelId,
    required this.vehicleId,
    required this.bunkId,
    required this.vehicleName,
    required this.vehicleNumber,
    required this.bunkName,
    required this.volume,
    required this.amount,
    required this.date,
    required this.kilometer,
    required this.isVerified,
  });

  String get formattedDate => formatFleetDate(date);

  factory FuelRecordModel.fromJson(Map<String, dynamic> json) {
    final vehicle = json['vehicle'] is Map ? json['vehicle'] as Map : null;
    final bunk = json['fuelBunk'] is Map ? json['fuelBunk'] as Map : null;

    return FuelRecordModel(
      fuelId: int.tryParse((json['fuelId'] ?? json['id'] ?? '0').toString()) ?? 0,
      vehicleId: int.tryParse((json['vehicleId'] ?? '0').toString()) ?? 0,
      bunkId: int.tryParse((json['bunkId'] ?? '0').toString()) ?? 0,
      vehicleName: vehicle != null ? (vehicle['vehicleName'] ?? '').toString() : '',
      vehicleNumber: vehicle != null ? (vehicle['vehicleNumber'] ?? '').toString() : '',
      bunkName: bunk != null ? (bunk['bunkName'] ?? '').toString() : (json['bunkName'] ?? 'Bunk').toString(),
      volume: double.tryParse((json['volume'] ?? '0').toString()) ?? 0.0,
      amount: double.tryParse((json['amount'] ?? '0').toString()) ?? 0.0,
      date: (json['date'] ?? '').toString(),
      kilometer: (json['kilometer'] ?? '0').toString(),
      isVerified: json['isVerified'] == true || json['isVerified'] == 1 || json['isVerified'] == '1',
    );
  }
}

class BunkModel {
  final int id;
  final String bunkName;
  final String ownerName;
  final String phoneNumber;
  final String address;
  final double amount;

  BunkModel({
    required this.id,
    required this.bunkName,
    required this.ownerName,
    required this.phoneNumber,
    required this.address,
    required this.amount,
  });

  factory BunkModel.fromJson(Map<String, dynamic> json) {
    return BunkModel(
      id: int.tryParse((json['id'] ?? '0').toString()) ?? 0,
      bunkName: (json['bunkName'] ?? '').toString().trim(),
      ownerName: (json['ownerName'] ?? '').toString().trim(),
      phoneNumber: (json['phoneNumber'] ?? '').toString().trim(),
      address: (json['address'] ?? '').toString().trim(),
      amount: double.tryParse((json['amount'] ?? '0').toString()) ?? 0.0,
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
  static Future<List<VehicleModel>> fetchVehicles({String search = ""}) async {
    try {
      final path = search.isNotEmpty ? '/vehicles?search=${Uri.encodeComponent(search)}' : '/vehicles';
      final res = await ApiClient.get(path);
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

  /// Fetches fuel records from backend: /api/vehicle-fuels
  static Future<List<FuelRecordModel>> fetchFuelRecords({int page = 1, String search = ""}) async {
    try {
      String path;
      if (search.isNotEmpty) {
        path = '/vehicle-fuels/search/by-vehicle-number?vehicleNumber=${Uri.encodeComponent(search)}';
      } else {
        path = '/vehicle-fuels?page=$page&limit=100';
      }
      final res = await ApiClient.get(path);
      if (res.isSuccess && res.data != null) {
        final dynamic raw = res.data;
        List? list;
        if (raw is List) {
          list = raw;
        } else if (raw is Map) {
          if (raw['fuels'] is List) {
            list = raw['fuels'] as List;
          } else if (raw['data'] is List) {
            list = raw['data'] as List;
          }
        }
        if (list != null) {
          return list
              .map((item) => FuelRecordModel.fromJson(Map<String, dynamic>.from(item)))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }

  /// Fetches bunks: /api/bunks
  static Future<List<BunkModel>> fetchBunks() async {
    try {
      final res = await ApiClient.get('/bunks');
      if (res.isSuccess && res.data != null) {
        final dynamic raw = res.data;
        List? list;
        if (raw is List) {
          list = raw;
        } else if (raw is Map && raw['data'] is List) {
          list = raw['data'] as List;
        }
        if (list != null) {
          return list
              .map((item) => BunkModel.fromJson(Map<String, dynamic>.from(item)))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }

  /// Creates a fuel fill record: POST /api/vehicle-fuels
  static Future<ApiResponse> createFuelRecord({
    required int vehicleId,
    required int bunkId,
    required double volume,
    required double amount,
    required String date,
    required String kilometer,
  }) async {
    return await ApiClient.post('/vehicle-fuels', {
      'vehicleId': vehicleId,
      'bunkId': bunkId,
      'volume': volume,
      'amount': amount,
      'date': date,
      'kilometer': kilometer,
    });
  }

  /// Verifies a fuel record: PATCH /api/vehicle-fuels/:id/verify
  static Future<ApiResponse> verifyFuelRecord(int fuelId) async {
    return await ApiClient.patch('/vehicle-fuels/$fuelId/verify', {});
  }

  /// Deletes a fuel record: DELETE /api/vehicle-fuels/:id
  static Future<ApiResponse> deleteFuelRecord(int fuelId) async {
    return await ApiClient.delete('/vehicle-fuels/$fuelId');
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

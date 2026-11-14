import '../models/stock_item.dart';
import '../models/production_log_item.dart';
import 'api_client.dart';

class StaffMember {
  final int id;
  final String name;
  final String? role;

  StaffMember({required this.id, required this.name, this.role});

  String get displayName => role != null && role!.isNotEmpty ? "$name ($role)" : name;
}

class StockService {
  static List<StockItem> _items = [];
  static List<String> _offices = ["Office", "Thottam"];
  static List<String> _products = [];
  static List<String> _brickProducts = [];
  static List<String> _cementProducts = [];
  static List<String> _staff = [];
  static List<StaffMember> _staffMembers = [];
  static List<ProductionLogItem> _history = [];

  static List<StockItem> get currentItems => _items;
  static List<String> get currentOffices => _offices;
  static List<String> get currentProducts => _products;
  static List<String> get currentBrickProducts => _brickProducts;
  static List<String> get currentCementProducts => _cementProducts;
  static List<String> get currentStaff => _staff;
  static List<StaffMember> get currentStaffMembers => _staffMembers;

  /// Returns total bricks physically in stock summed from backend records
  static int get totalBricksInStock {
    return _items
        .where((it) => it.category.toLowerCase().contains("brick"))
        .fold<int>(0, (sum, it) => sum + it.quantity.toInt());
  }
  static List<ProductionLogItem> get currentHistory => _history;

  /// Fetches stock records ONLY from the backend API: /api/stock
  static Future<List<StockItem>> fetchStock() async {
    final res = await ApiClient.get('/stock');

    if (res.isSuccess && res.data != null) {
      final dynamic raw = res.data;
      List? list;
      if (raw is List) {
        list = raw;
      } else if (raw is Map && raw['data'] is List) {
        list = raw['data'] as List;
      }

      if (list != null) {
        _items = list
            .map((item) => StockItem.fromJson(item as Map<String, dynamic>))
            .toList();

        // Dynamically update available offices from real backend stock
        final officesSet = _items.map((it) => it.officeName).where((s) => s.isNotEmpty).toSet();
        if (officesSet.isNotEmpty) {
          // Keep Office first, Thottam second
          final sortedOffices = officesSet.toList();
          sortedOffices.sort((a, b) {
            if (a.toLowerCase() == "office") return -1;
            if (b.toLowerCase() == "office") return 1;
            return a.compareTo(b);
          });
          _offices = sortedOffices;
        }

        final productsSet = _items.map((it) => it.productName).where((s) => s.isNotEmpty).toSet();
        if (productsSet.isNotEmpty) {
          _products = productsSet.toList();
        }
      }
    }
    return _items;
  }

  /// Fetches plant offices dynamically from backend: /api/offices
  static Future<List<String>> fetchOffices() async {
    final res = await ApiClient.get('/offices');
    if (res.isSuccess && res.data != null) {
      final dynamic raw = res.data;
      List? list;
      if (raw is List) {
        list = raw;
      } else if (raw is Map && raw['data'] is List) {
        list = raw['data'] as List;
      }

      if (list != null && list.isNotEmpty) {
        final parsed = list
            .map((o) {
              String name = (o['office_name'] ?? o['name'] ?? '').toString().trim();
              if (name.toLowerCase() == "thoom") name = "Thottam";
              return name;
            })
            .where((name) => name.isNotEmpty)
            .toSet()
            .toList();

        if (parsed.isNotEmpty) {
          parsed.sort((a, b) {
            if (a.toLowerCase() == "office") return -1;
            if (b.toLowerCase() == "office") return 1;
            return a.compareTo(b);
          });
          _offices = parsed;
          return _offices;
        }
      }
    }
    return _offices;
  }

  /// Fetches products dynamically from backend: /api/products
  static Future<List<String>> fetchProducts() async {
    final res = await ApiClient.get('/products');
    if (res.isSuccess && res.data != null) {
      final dynamic raw = res.data;
      List? list;
      if (raw is List) {
        list = raw;
      } else if (raw is Map && raw['data'] is List) {
        list = raw['data'] as List;
      }

      if (list != null && list.isNotEmpty) {
        _products = list
            .map((p) => (p['product_name'] ?? p['name'] ?? '').toString().trim())
            .where((name) => name.isNotEmpty)
            .toSet()
            .toList();
        return _products;
      }
    }
    return _products;
  }

  /// Fetches BRICK products ONLY (filters for category "bricks" and deduplicates)
  static Future<List<String>> fetchBrickProducts() async {
    final res = await ApiClient.get('/products');
    if (res.isSuccess && res.data != null) {
      final dynamic raw = res.data;
      List? list;
      if (raw is List) {
        list = raw;
      } else if (raw is Map && raw['data'] is List) {
        list = raw['data'] as List;
      }

      if (list != null && list.isNotEmpty) {
        final brickList = list
            .where((p) {
              final cat = (p['category'] ?? '').toString().toLowerCase().trim();
              return cat == 'bricks' || cat == 'brick';
            })
            .map((p) => (p['product_name'] ?? p['name'] ?? '').toString().trim())
            .where((name) => name.isNotEmpty)
            .toSet()
            .toList();

        if (brickList.isNotEmpty) {
          _brickProducts = brickList;
          return _brickProducts;
        }
      }
    }

    // Fallback: filter from live _items where category == "bricks"
    final liveBricks = _items
        .where((it) => it.category.contains("brick"))
        .map((it) => it.productName.trim())
        .where((n) => n.isNotEmpty)
        .toSet()
        .toList();

    _brickProducts = liveBricks;
    return _brickProducts;
  }

  /// Fetches CEMENT products ONLY (filters for category "cement" and deduplicates)
  static Future<List<String>> fetchCementProducts() async {
    final res = await ApiClient.get('/products');
    if (res.isSuccess && res.data != null) {
      final dynamic raw = res.data;
      List? list;
      if (raw is List) {
        list = raw;
      } else if (raw is Map && raw['data'] is List) {
        list = raw['data'] as List;
      }

      if (list != null && list.isNotEmpty) {
        final cementList = list
            .where((p) {
              final cat = (p['category'] ?? '').toString().toLowerCase().trim();
              return cat.contains('cement');
            })
            .map((p) => (p['product_name'] ?? p['name'] ?? '').toString().trim())
            .where((name) => name.isNotEmpty)
            .toSet()
            .toList();

        if (cementList.isNotEmpty) {
          _cementProducts = cementList;
          return _cementProducts;
        }
      }
    }

    final liveCements = _items
        .where((it) => it.category.contains("cement"))
        .map((it) => it.productName.trim())
        .where((n) => n.isNotEmpty)
        .toSet()
        .toList();

    _cementProducts = liveCements;
    return _cementProducts;
  }

  /// Returns live StockItem brick products specifically available at an office
  static List<StockItem> getBrickProductsForOffice(String? officeName) {
    if (officeName == null || officeName.isEmpty) return [];
    final officeLower = officeName.toLowerCase().trim();

    return _items.where((it) {
      final itemOffice = it.officeName.toLowerCase().trim();
      final matchesOffice = itemOffice == officeLower ||
          (officeLower.contains("off") && itemOffice.contains("off")) ||
          (officeLower.contains("thot") && (itemOffice.contains("thot") || itemOffice.contains("thoom")));
      final isBrick = it.category.contains("brick");
      return matchesOffice && isBrick;
    }).toList();
  }

  /// Returns live StockItem cement products specifically available at an office
  static List<StockItem> getCementProductsForOffice(String? officeName) {
    if (officeName == null || officeName.isEmpty) return [];
    final officeLower = officeName.toLowerCase().trim();

    final matched = _items.where((it) {
      final itemOffice = it.officeName.toLowerCase().trim();
      final matchesOffice = itemOffice == officeLower ||
          (officeLower.contains("off") && itemOffice.contains("off")) ||
          (officeLower.contains("thot") && (itemOffice.contains("thot") || itemOffice.contains("thoom")));
      final isCement = it.category.contains("cement");
      return matchesOffice && isCement;
    }).toList();

    if (matched.isNotEmpty) return matched;

    // Cross-office cement items
    return _items.where((it) => it.category.contains("cement")).toList();
  }

  /// Fetches staff / employees dynamically from backend: /api/employees
  static Future<List<String>> fetchEmployees() async {
    final res = await ApiClient.get('/employees');
    if (res.isSuccess && res.data != null) {
      final dynamic raw = res.data;
      List? list;
      if (raw is List) {
        list = raw;
      } else if (raw is Map && raw['data'] is List) {
        list = raw['data'] as List;
      }

      if (list != null && list.isNotEmpty) {
        _staffMembers = list.map((emp) {
          final id = int.tryParse((emp['employee_id'] ?? emp['userid'] ?? emp['id'] ?? '0').toString()) ?? 0;
          final name = (emp['employee_name'] ?? emp['name'] ?? 'Staff').toString().trim();
          final role = emp['staff_role']?.toString().trim();
          return StaffMember(id: id, name: name, role: role);
        }).toList();
        _staff = _staffMembers.map((s) => s.displayName).toList();
        return _staff;
      }
    }

    // Fallback to driver staff route: /api/user/drivers
    final driverRes = await ApiClient.get('/user/drivers');
    if (driverRes.isSuccess && driverRes.data != null) {
      final dynamic raw = driverRes.data;
      List? list = raw is List ? raw : (raw is Map ? raw['data'] as List? : null);
      if (list != null && list.isNotEmpty) {
        _staffMembers = list.map((u) {
          final id = int.tryParse((u['userid'] ?? u['id'] ?? '0').toString()) ?? 0;
          final name = (u['name'] ?? u['email'] ?? 'Driver').toString().trim();
          final role = u['staffRole']?.toString().trim();
          return StaffMember(id: id, name: name, role: role);
        }).toList();
        _staff = _staffMembers.map((s) => s.displayName).toList();
      }
    }

    return _staff;
  }

  /// Filters stock items matching store filter, category filter, and search query
  static List<StockItem> getFilteredItems({
    String filter = "all", // "all", "office", "thottam"
    String category = "all", // "all", "sand", "bricks", "cement"
    String searchQuery = "",
  }) {
    return _items.where((item) {
      final itemOffice = item.officeName.toLowerCase().trim();
      final filterLower = filter.toLowerCase().trim();

      bool matchesFilter = false;
      if (filterLower == "all") {
        matchesFilter = true;
      } else if (filterLower == "office") {
        matchesFilter = itemOffice.contains("off");
      } else if (filterLower == "thottam") {
        matchesFilter = itemOffice.contains("thot") || itemOffice.contains("thoom");
      } else {
        matchesFilter = itemOffice == filterLower;
      }

      final catLower = category.toLowerCase().trim();
      bool matchesCategory = false;
      if (catLower == "all") {
        matchesCategory = true;
      } else if (catLower == "brick" || catLower == "bricks") {
        matchesCategory = item.category.contains("brick");
      } else if (catLower == "sand") {
        matchesCategory = item.category.contains("sand") || item.category.contains("stone") || item.category.contains("raw");
      } else if (catLower == "cement") {
        matchesCategory = item.category.contains("cement");
      } else {
        matchesCategory = item.category.contains(catLower);
      }

      final query = searchQuery.trim().toLowerCase();
      final matchesSearch = query.isEmpty ||
          item.productName.toLowerCase().contains(query) ||
          item.category.toLowerCase().contains(query) ||
          item.productId.toString().contains(query) ||
          "prod-${item.productId}".toLowerCase().contains(query) ||
          item.officeName.toLowerCase().contains(query);

      return matchesFilter && matchesCategory && matchesSearch;
    }).toList();
  }

  /// Logs a production batch directly to backend /api/production
  static Future<bool> addProductionEntry({
    required String officeName,
    required String productName,
    int? productId,
    int? officeId,
    int? cementProductId,
    required int numberOfStocks,
    required int bricksPerStock,
    required int cementBags,
    required double pricePerStock,
    required String date,
    List<int> employeeIds = const [],
    List<String> selectedStaff = const [],
  }) async {
    final totalAddedQuantity = numberOfStocks * bricksPerStock;

    // Resolve product_id and office_id if not passed
    int pId = productId ?? 0;
    int offId = officeId ?? 0;

    if (pId == 0 || offId == 0) {
      final matches = _items.where((it) => it.productName.toLowerCase() == productName.toLowerCase()).toList();
      if (matches.isNotEmpty) {
        if (pId == 0) pId = matches.first.productId;
        if (offId == 0) offId = matches.first.officeId;
      }
    }

    // Resolve employee_ids from selectedStaff if empty
    List<int> resolvedEmployeeIds = List<int>.from(employeeIds);
    if (resolvedEmployeeIds.isEmpty && selectedStaff.isNotEmpty) {
      for (final staffName in selectedStaff) {
        final match = _staffMembers.firstWhere(
          (m) => m.displayName.toLowerCase() == staffName.toLowerCase() ||
                 m.name.toLowerCase() == staffName.toLowerCase() ||
                 staffName.toLowerCase().startsWith(m.name.toLowerCase()),
          orElse: () => StaffMember(id: 0, name: ''),
        );
        if (match.id > 0 && !resolvedEmployeeIds.contains(match.id)) {
          resolvedEmployeeIds.add(match.id);
        }
      }
    }

    final Map<String, dynamic> body = {
      "office_id": offId > 0 ? offId : (officeName.toLowerCase().contains("thot") ? 2 : 1),
      "product_id": pId,
      "unit_produced": totalAddedQuantity,
      "cement_used": cementBags,
      "production_date": date,
      "number_of_stocks": numberOfStocks,
      "price_per_stock": pricePerStock,
      "employee_ids": resolvedEmployeeIds,
    };

    if (cementProductId != null && cementProductId > 0) {
      body["cement_product_id"] = cementProductId;
    }

    final res = await ApiClient.post('/production', body);

    // Re-fetch live stock and production logs from backend after entry
    await fetchStock();
    await fetchProductionHistory();

    return res.isSuccess;
  }

  /// Fetches production history directly from backend: /api/production/history
  static Future<List<ProductionLogItem>> fetchProductionHistory() async {
    final res = await ApiClient.get('/production/history');
    if (res.isSuccess && res.data != null) {
      final dynamic raw = res.data;
      List? list;
      if (raw is List) {
        list = raw;
      } else if (raw is Map && raw['data'] is List) {
        list = raw['data'] as List;
      }

      if (list != null) {
        _history = list
            .map((item) => ProductionLogItem.fromJson(item as Map<String, dynamic>))
            .toList();
      } else {
        _history = [];
      }
    } else {
      _history = [];
    }
    return _history;
  }

  /// Deletes a production log by ID: /api/production/:id
  /// Backend automatically restores cement bags & raw materials, reduces brick stock, and reverses operator wages.
  static Future<bool> deleteProductionLog(int id) async {
    final res = await ApiClient.delete('/production/$id');
    if (res.isSuccess) {
      _history.removeWhere((item) => item.id == id);
      // Re-fetch live stock and history to reflect restored cement and reduced brick inventory
      await fetchStock();
      await fetchProductionHistory();
      return true;
    }
    return false;
  }

  /// Filters production history logs matching timeRange, plant office, product, and search query
  static List<ProductionLogItem> getFilteredHistory({
    String office = "all", // "all", "office", "thottam"
    String timeRange = "all", // "all", "today", "week", "month"
    String product = "all",
    String searchQuery = "",
    String sortBy = "newest", // "newest", "oldest", "highest_units"
  }) {
    final now = DateTime.now();
    final todayStr = "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
    final startOfWeek = DateTime(now.year, now.month, now.day - (now.weekday % 7));
    final startOfMonth = DateTime(now.year, now.month, 1);

    final filtered = _history.where((log) {
      // Office match
      final offLower = office.toLowerCase().trim();
      final logOff = log.officeName.toLowerCase().trim();
      bool matchesOffice = false;
      if (offLower == "all") {
        matchesOffice = true;
      } else if (offLower == "office") {
        matchesOffice = logOff.contains("off");
      } else if (offLower == "thottam") {
        matchesOffice = logOff.contains("thot") || logOff.contains("thoom");
      } else {
        matchesOffice = logOff == offLower;
      }

      // Product match
      bool matchesProduct = true;
      if (product.toLowerCase() != "all") {
        matchesProduct = log.productName.toLowerCase().trim() == product.toLowerCase().trim();
      }

      // Date match
      bool matchesDate = true;
      DateTime? logDate;
      try {
        logDate = DateTime.tryParse(log.date.split('T').first);
      } catch (_) {}

      if (timeRange == "today") {
        matchesDate = log.date.startsWith(todayStr);
      } else if (timeRange == "week" && logDate != null) {
        matchesDate = logDate.isAfter(startOfWeek.subtract(const Duration(seconds: 1)));
      } else if (timeRange == "month" && logDate != null) {
        matchesDate = logDate.isAfter(startOfMonth.subtract(const Duration(seconds: 1)));
      }

      // Search match
      final q = searchQuery.toLowerCase().trim();
      bool matchesSearch = true;
      if (q.isNotEmpty) {
        matchesSearch = log.productName.toLowerCase().contains(q) ||
            log.officeName.toLowerCase().contains(q) ||
            log.date.contains(q) ||
            "#prod-${log.id}".contains(q) ||
            "prod-${log.id}".contains(q) ||
            log.id.toString().contains(q) ||
            log.cementProductName.toLowerCase().contains(q) ||
            log.employeeNames.any((e) => e.toLowerCase().contains(q));
      }

      return matchesOffice && matchesProduct && matchesDate && matchesSearch;
    }).toList();

    filtered.sort((a, b) {
      if (sortBy == "highest_units") {
        return b.unitProduced.compareTo(a.unitProduced);
      } else if (sortBy == "oldest") {
        return a.date.compareTo(b.date);
      } else {
        final dateCmp = b.date.compareTo(a.date);
        if (dateCmp != 0) return dateCmp;
        return b.id.compareTo(a.id);
      }
    });

    return filtered;
  }
}

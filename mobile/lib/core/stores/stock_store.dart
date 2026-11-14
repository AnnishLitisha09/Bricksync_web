import 'package:flutter/foundation.dart';
import '../models/stock_item.dart';
import '../models/production_log_item.dart';
import '../services/stock_service.dart';

/// Zustand-style reactive store for Stock Inventory & Production History.
/// Replicates the web app's `useStockStore` with reactive ChangeNotifier notifications,
/// TTL caching, and instant automatic background re-fetching on bottom bar tab switches.
class StockStore extends ChangeNotifier {
  // Singleton instance
  static final StockStore _instance = StockStore._internal();
  factory StockStore() => _instance;
  StockStore._internal();

  // State
  List<StockItem> _stock = [];
  List<String> _offices = ["Office", "Thottam"];
  List<ProductionLogItem> _history = [];
  List<String> _products = [];
  List<String> _brickProducts = [];
  List<String> _cementProducts = [];
  List<StaffMember> _staffMembers = [];

  bool _loading = false;
  bool _historyLoading = false;
  bool _isSyncing = false;
  String? _error;
  DateTime? _lastFetched;
  DateTime? _lastHistoryFetched;

  // TTL: 90 seconds (matches frontend useStockStore.ts)
  static const Duration ttl = Duration(seconds: 90);

  // Getters
  List<StockItem> get stock => _stock;
  List<String> get offices => _offices;
  List<ProductionLogItem> get history => _history;
  List<String> get products => _products;
  List<String> get brickProducts => _brickProducts;
  List<String> get cementProducts => _cementProducts;
  List<StaffMember> get staffMembers => _staffMembers;

  bool get loading => _loading;
  bool get historyLoading => _historyLoading;
  bool get isSyncing => _isSyncing;
  String? get error => _error;
  DateTime? get lastFetched => _lastFetched;
  DateTime? get lastHistoryFetched => _lastHistoryFetched;

  bool get isStale =>
      _lastFetched == null || DateTime.now().difference(_lastFetched!) > ttl;

  bool get isHistoryStale =>
      _lastHistoryFetched == null ||
      DateTime.now().difference(_lastHistoryFetched!) > ttl;

  /// Total brick inventory physically in stock across all plants
  int get totalBricksInStock {
    return _stock
        .where((it) => it.category.toLowerCase().contains("brick"))
        .fold<int>(0, (sum, it) => sum + it.quantity.toInt());
  }

  /// Invalidate cache timestamps to force next fetch
  void invalidate() {
    _lastFetched = null;
    _lastHistoryFetched = null;
    notifyListeners();
  }

  /// Fetches stock records & offices from backend API: /api/stock, /api/offices
  /// If [force] is true, ignores TTL and fetches directly from the backend.
  Future<void> fetchStockData({bool force = false}) async {
    if (!force && !isStale && _stock.isNotEmpty) return;

    if (_stock.isEmpty) {
      _loading = true;
    } else {
      _isSyncing = true;
    }
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        StockService.fetchStock(),
        StockService.fetchOffices(),
      ]);

      _stock = results[0] as List<StockItem>;
      final fetchedOffices = results[1] as List<String>;
      if (fetchedOffices.isNotEmpty) {
        _offices = fetchedOffices;
      }
      _lastFetched = DateTime.now();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      _isSyncing = false;
      notifyListeners();
    }
  }

  /// Fetches production logs from backend API: /api/production
  /// If [force] is true, ignores TTL and fetches directly from the backend.
  Future<void> fetchProductionHistory({bool force = false}) async {
    if (!force && !isHistoryStale && _history.isNotEmpty) return;

    _historyLoading = true;
    _error = null;
    notifyListeners();

    try {
      final logs = await StockService.fetchProductionHistory();
      _history = logs;
      _lastHistoryFetched = DateTime.now();
    } catch (e) {
      _error = e.toString();
    } finally {
      _historyLoading = false;
      notifyListeners();
    }
  }

  /// Fetches product and staff catalogs dynamically from backend
  Future<void> fetchCatalogs() async {
    try {
      final prods = await StockService.fetchProducts();
      final bricks = await StockService.fetchBrickProducts();
      final cements = await StockService.fetchCementProducts();
      await StockService.fetchEmployees();
      _products = prods;
      _brickProducts = bricks;
      _cementProducts = cements;
      _staffMembers = StockService.currentStaffMembers;
      notifyListeners();
    } catch (_) {}
  }

  /// Concurrently refreshes stock inventory, production logs, and catalogs from backend
  Future<void> refreshAll({bool force = true}) async {
    await Future.wait([
      fetchStockData(force: force),
      fetchProductionHistory(force: force),
      fetchCatalogs(),
    ]);
  }

  /// Returns filtered stock items based on store, category, and search query
  List<StockItem> getFilteredItems({
    String filter = "all",
    String category = "all",
    String searchQuery = "",
  }) {
    return StockService.getFilteredItems(
      filter: filter,
      category: category,
      searchQuery: searchQuery,
    );
  }

  /// Returns filtered production logs based on office, timeRange, product, and search query
  List<ProductionLogItem> getFilteredHistory({
    String office = "all",
    String timeRange = "all",
    String product = "all",
    String searchQuery = "",
    String sortBy = "newest",
  }) {
    return StockService.getFilteredHistory(
      office: office,
      timeRange: timeRange,
      product: product,
      searchQuery: searchQuery,
      sortBy: sortBy,
    );
  }
}

/// Global top-level accessor matching Zustand's store export
final StockStore stockStore = StockStore();

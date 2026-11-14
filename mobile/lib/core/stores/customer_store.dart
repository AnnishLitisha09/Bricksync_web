import 'package:flutter/foundation.dart';
import '../services/customer_service.dart';

/// Zustand-style reactive store for Customer CRM & Accounts.
/// Replicates the web app's `useCustomerStore` with reactive ChangeNotifier notifications,
/// TTL caching, and instant automatic background re-fetching on bottom bar tab switches.
class CustomerStore extends ChangeNotifier {
  // Singleton instance
  static final CustomerStore _instance = CustomerStore._internal();
  factory CustomerStore() => _instance;
  CustomerStore._internal();

  // State
  List<CustomerItem> _customers = [];
  int _totalClientsCount = 0;
  double _totalReceivables = 0.0;

  bool _loading = false;
  bool _isSyncing = false;
  String? _error;
  DateTime? _lastFetched;
  String _lastSearch = "";

  // TTL: 60 seconds (matches frontend useCustomerStore.ts)
  static const Duration ttl = Duration(seconds: 60);

  // Getters
  List<CustomerItem> get customers => _customers;
  int get totalClientsCount =>
      _totalClientsCount > 0 ? _totalClientsCount : _customers.length;
  double get totalReceivables => _totalReceivables;

  bool get loading => _loading;
  bool get isSyncing => _isSyncing;
  String? get error => _error;
  DateTime? get lastFetched => _lastFetched;
  String get lastSearch => _lastSearch;

  bool get isStale =>
      _lastFetched == null || DateTime.now().difference(_lastFetched!) > ttl;

  /// Invalidate cache timestamps to force next fetch
  void invalidate() {
    _lastFetched = null;
    notifyListeners();
  }

  /// Fetches customers from backend API: /api/customers
  /// If [force] is true, ignores TTL and fetches directly from the backend.
  Future<void> fetchCustomers({String search = "", bool force = false}) async {
    final sameQuery = search == _lastSearch;
    if (!force && sameQuery && !isStale && _customers.isNotEmpty) return;

    if (_customers.isEmpty) {
      _loading = true;
    } else {
      _isSyncing = true;
    }
    _error = null;
    _lastSearch = search;
    notifyListeners();

    try {
      final res = await CustomerService.fetchCustomers(search: search);
      _customers = res;
      _totalClientsCount = CustomerService.totalClientsCount;
      _totalReceivables = CustomerService.totalReceivables;
      _lastFetched = DateTime.now();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loading = false;
      _isSyncing = false;
      notifyListeners();
    }
  }

  /// Updates customer balance directly and updates reactive store state
  Future<bool> updateCustomerBalance(int customerId, double newBalance) async {
    final success = await CustomerService.updateCustomerBalance(customerId, newBalance);
    if (success) {
      // Optimistically update locally
      final idx = _customers.indexWhere((c) => c.id == customerId);
      if (idx != -1) {
        final oldBal = _customers[idx].outstandingBalance;
        _customers[idx] = _customers[idx].copyWith(outstandingBalance: newBalance);
        _totalReceivables = _totalReceivables - oldBal + newBalance;
        notifyListeners();
      }
      // Re-fetch in background to sync authoritative state from backend
      fetchCustomers(search: _lastSearch, force: true);
    }
    return success;
  }

  /// Adds a new customer to backend and refreshes the store
  Future<bool> createCustomer({
    required String name,
    String? phone,
    String? category,
    String? email,
    double balance = 0.0,
    String? address,
  }) async {
    final success = await CustomerService.createCustomer(
      name: name,
      phone: phone,
      category: category,
      email: email,
      balance: balance,
      address: address,
    );
    if (success) {
      await fetchCustomers(search: _lastSearch, force: true);
    }
    return success;
  }
}

/// Global top-level accessor matching Zustand's store export
final CustomerStore customerStore = CustomerStore();

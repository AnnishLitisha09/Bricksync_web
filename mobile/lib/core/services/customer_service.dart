import 'api_client.dart';

class BankAccountModel {
  final int id;
  final String name;
  final String accountNumber;
  final String holderName;
  final double amount;
  final bool bankTransfer;
  final bool phonepe;
  final bool gpay;

  BankAccountModel({
    required this.id,
    required this.name,
    required this.accountNumber,
    required this.holderName,
    required this.amount,
    required this.bankTransfer,
    required this.phonepe,
    required this.gpay,
  });

  String get displayName {
    if (accountNumber.isNotEmpty) {
      return "$name - $accountNumber";
    }
    return name;
  }

  factory BankAccountModel.fromJson(Map<String, dynamic> json) {
    return BankAccountModel(
      id: int.tryParse((json['id'] ?? '0').toString()) ?? 0,
      name: (json['name'] ?? 'Bank').toString().trim(),
      accountNumber: (json['accountNumber'] ?? '').toString().trim(),
      holderName: (json['holderName'] ?? '').toString().trim(),
      amount: double.tryParse((json['amount'] ?? '0').toString()) ?? 0.0,
      bankTransfer: json['bankTransfer'] == true || json['bankTransfer'] == 1 || json['bankTransfer'] == '1',
      phonepe: json['phonepe'] == true || json['phonepe'] == 1 || json['phonepe'] == '1',
      gpay: json['gpay'] == true || json['gpay'] == 1 || json['gpay'] == '1',
    );
  }
}

class CustomerItem {
  final int id;
  final String name;
  final String phone;
  final String location;
  final double outstandingBalance;
  final int totalOrders;
  final String category;
  final String email;

  CustomerItem({
    required this.id,
    required this.name,
    required this.phone,
    required this.location,
    required this.outstandingBalance,
    this.totalOrders = 0,
    this.category = 'other',
    this.email = '',
  });

  CustomerItem copyWith({
    int? id,
    String? name,
    String? phone,
    String? location,
    double? outstandingBalance,
    int? totalOrders,
    String? category,
    String? email,
  }) {
    return CustomerItem(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      location: location ?? this.location,
      outstandingBalance: outstandingBalance ?? this.outstandingBalance,
      totalOrders: totalOrders ?? this.totalOrders,
      category: category ?? this.category,
      email: email ?? this.email,
    );
  }

  factory CustomerItem.fromJson(Map<String, dynamic> json) {
    return CustomerItem(
      id: int.tryParse((json['customer_id'] ?? json['id'] ?? '0').toString()) ?? 0,
      name: (json['name'] ?? json['customer_name'] ?? 'Customer').toString().trim(),
      phone: (json['phone_no'] ?? json['phone'] ?? '').toString().trim(),
      location: (json['address'] ?? json['location'] ?? '').toString().trim(),
      outstandingBalance: double.tryParse(json['balance']?.toString() ?? '0.0') ?? 0.0,
      totalOrders: int.tryParse((json['orders_count'] ?? json['total_orders'] ?? '0').toString()) ?? 0,
      category: (json['category'] ?? 'other').toString().toLowerCase().trim(),
      email: (json['email'] ?? '').toString().trim(),
    );
  }
}

class CustomerOrderItemDetail {
  final String product;
  final String office;
  final double quantity;
  final double rate;
  final String vehicle;
  final String staff;

  CustomerOrderItemDetail({
    required this.product,
    this.office = '',
    required this.quantity,
    required this.rate,
    this.vehicle = '',
    this.staff = '',
  });
}

class CustomerLedgerEntry {
  final String id;
  final String date;
  final String type; // "Dispatch" or "Payment"
  final String particulars;
  final double amount;
  final double credit; // Dispatch
  final double debit; // Payment
  final String office;
  final List<CustomerOrderItemDetail> items;

  CustomerLedgerEntry({
    required this.id,
    required this.date,
    required this.type,
    required this.particulars,
    required this.amount,
    required this.credit,
    required this.debit,
    this.office = '',
    this.items = const [],
  });
}

class CustomerCallLogEntry {
  final int id;
  final String date;
  final String nextCallDate;
  final String description;
  final bool isCalled;

  CustomerCallLogEntry({
    required this.id,
    required this.date,
    required this.nextCallDate,
    required this.description,
    this.isCalled = false,
  });
}

class CustomerDetailData {
  final CustomerItem customer;
  final double totalBilled;
  final double totalPaid;
  final double outstandingBalance;
  final List<CustomerLedgerEntry> entries;
  final List<CustomerCallLogEntry> callLogs;

  CustomerDetailData({
    required this.customer,
    required this.totalBilled,
    required this.totalPaid,
    required this.outstandingBalance,
    required this.entries,
    required this.callLogs,
  });

  List<CustomerLedgerEntry> get ledgerEntries => entries;
}

class CustomerService {
  static List<CustomerItem> _customers = [];
  static int _totalClientsCount = 0;
  static double _totalReceivables = 0.0;

  static List<CustomerItem> get currentCustomers => _customers;
  static int get totalClientsCount => _totalClientsCount > 0 ? _totalClientsCount : _customers.length;
  static double get totalReceivables => _totalReceivables;

  /// Fetches customers from backend API across all pages so no customers are missed
  static Future<List<CustomerItem>> fetchCustomers({String search = ""}) async {
    final List<CustomerItem> allFetched = [];
    int page = 1;
    int totalPages = 1;

    do {
      final query = search.isNotEmpty
          ? "?search=${Uri.encodeComponent(search)}&page=$page&limit=500"
          : "?page=$page&limit=500";
      final res = await ApiClient.get('/customers$query');

      if (!res.isSuccess || res.data == null) break;

      final dynamic raw = res.data;
      List? list;
      if (raw is List) {
        list = raw;
      } else if (raw is Map) {
        if (raw['data'] is List) {
          list = raw['data'] as List;
        } else if (raw['rows'] is List) {
          list = raw['rows'] as List;
        }

        final pagination = raw['pagination'] as Map<String, dynamic>?;
        if (pagination != null) {
          totalPages = int.tryParse(pagination['totalPages']?.toString() ?? '1') ?? 1;
          final total = int.tryParse(pagination['total']?.toString() ?? '0') ?? 0;
          if (total > 0) _totalClientsCount = total;
        }

        final summary = raw['summary'] as Map<String, dynamic>?;
        if (summary != null) {
          _totalReceivables = double.tryParse(summary['totalOutstanding']?.toString() ?? '0') ?? 0.0;
          final totalClients = int.tryParse(summary['totalClients']?.toString() ?? '0') ?? 0;
          if (totalClients > 0) _totalClientsCount = totalClients;
        }
      }

      if (list != null && list.isNotEmpty) {
        allFetched.addAll(
          list.map((c) => CustomerItem.fromJson(c as Map<String, dynamic>)),
        );
      } else {
        break;
      }

      page++;
    } while (page <= totalPages && search.isEmpty);

    _customers = allFetched;
    if (_totalClientsCount == 0) _totalClientsCount = _customers.length;
    return _customers;
  }

  /// Fetches individual customer full ledger (orders, statements, logs)
  static Future<CustomerDetailData?> fetchCustomerDetails(int customerId) async {
    final res = await ApiClient.get('/customers/$customerId');
    if (!res.isSuccess || res.data == null) return null;

    final raw = (res.data is Map && res.data['data'] != null)
        ? res.data['data']
        : res.data;
    if (raw is! Map) return null;

    final customer = CustomerItem.fromJson(Map<String, dynamic>.from(raw));

    final List<CustomerLedgerEntry> entries = [];
    double totalBilled = 0.0;
    double totalPaid = 0.0;

    // Parse Orders
    final ordersRaw = raw['orders'];
    if (ordersRaw is List) {
      for (final o in ordersRaw) {
        if (o is! Map) continue;
        final orderId = (o['order_id'] ?? o['id'] ?? '').toString();
        final dateStr = (o['date'] ?? '').toString();
        final cleanDate = dateStr.contains('T') ? dateStr.split('T')[0] : dateStr;
        final transportCharge = double.tryParse((o['transport_charge'] ?? '0').toString()) ?? 0.0;

        final itemsRaw = o['items'];
        final List<CustomerOrderItemDetail> itemsList = [];
        double itemsTotal = 0.0;
        final List<String> productNames = [];
        final Set<String> officeNames = {};

        if (itemsRaw is List) {
          for (final it in itemsRaw) {
            if (it is! Map) continue;
            final product = (it['product'] ?? it['material']?['name'] ?? 'Material').toString();
            final qty = double.tryParse((it['quantity'] ?? '0').toString()) ?? 0.0;
            final rate = double.tryParse((it['price'] ?? '0').toString()) ?? 0.0;
            final office = (it['office']?['office_name'] ?? it['office_name'] ?? '').toString();
            final vehicle = (it['vehicle']?['vehicleNumber'] ?? it['vehicleNumber'] ?? '').toString();

            String staff = '';
            if (it['orderEmployees'] is List && (it['orderEmployees'] as List).isNotEmpty) {
              final oe = (it['orderEmployees'] as List).first;
              staff = (oe['employee']?['name'] ?? oe['employee']?['employee_name'] ?? '').toString();
            }

            itemsTotal += (qty * rate);
            productNames.add(product);
            if (office.isNotEmpty) officeNames.add(office);

            itemsList.add(CustomerOrderItemDetail(
              product: product,
              office: office,
              quantity: qty,
              rate: rate,
              vehicle: vehicle,
              staff: staff,
            ));
          }
        }

        final orderTotal = itemsTotal + transportCharge;
        totalBilled += orderTotal;

        final particulars = '${productNames.join(", ")}${transportCharge > 0 ? " + Transport (₹${transportCharge.toStringAsFixed(0)})" : ""}';

        entries.add(CustomerLedgerEntry(
          id: 'ORD-$orderId',
          date: cleanDate,
          type: 'Dispatch',
          particulars: particulars.isEmpty ? 'Dispatch Order' : particulars,
          amount: orderTotal,
          credit: orderTotal,
          debit: 0.0,
          office: officeNames.join(', '),
          items: itemsList,
        ));
      }
    }

    // Parse Statements (Payments)
    final statementsRaw = raw['statements'];
    if (statementsRaw is List) {
      for (final s in statementsRaw) {
        if (s is! Map) continue;
        final stmtId = (s['id'] ?? '').toString();
        final amount = double.tryParse((s['amount'] ?? '0').toString()) ?? 0.0;
        final bankType = (s['bank_type'] ?? 'Payment').toString();
        final desc = (s['description'] ?? '').toString();
        final dateStr = (s['date'] ?? s['created_at'] ?? '').toString();
        final cleanDate = dateStr.contains('T') ? dateStr.split('T')[0] : dateStr;

        totalPaid += amount;

        entries.add(CustomerLedgerEntry(
          id: 'STMT-$stmtId',
          date: cleanDate,
          type: 'Payment',
          particulars: 'Payment via $bankType${desc.isNotEmpty ? " ($desc)" : ""}',
          amount: amount,
          credit: 0.0,
          debit: amount,
        ));
      }
    }

    // Sort entries by date descending
    entries.sort((a, b) => b.date.compareTo(a.date));

    // Parse Call Logs
    final List<CustomerCallLogEntry> callLogs = [];
    final logsRaw = raw['callLogs'];
    if (logsRaw is List) {
      for (final l in logsRaw) {
        if (l is! Map) continue;
        callLogs.add(CustomerCallLogEntry(
          id: int.tryParse((l['id'] ?? '0').toString()) ?? 0,
          date: (l['date'] ?? '').toString(),
          nextCallDate: (l['next_call_date'] ?? '').toString(),
          description: (l['description'] ?? '').toString(),
          isCalled: l['is_called'] == true || l['is_called'] == 1,
        ));
      }
    }

    // Authoritative customer balance from DB (respects edited balance, including ₹0 Settled)
    final double outstanding = customer.outstandingBalance;

    return CustomerDetailData(
      customer: customer,
      totalBilled: totalBilled,
      totalPaid: totalPaid,
      outstandingBalance: outstanding,
      entries: entries,
      callLogs: callLogs,
    );
  }

  /// Updates customer balance in backend
  static Future<bool> updateCustomerBalance(int customerId, double balance) async {
    final res = await ApiClient.put('/customers/$customerId', {
      'balance': balance,
    });
    if (res.isSuccess) {
      final index = _customers.indexWhere((c) => c.id == customerId);
      if (index != -1) {
        final old = _customers[index];
        _customers[index] = old.copyWith(outstandingBalance: balance);
      }
      return true;
    }
    return false;
  }

  /// Fetches bank accounts and cash accounts: /api/banks
  static Future<List<BankAccountModel>> fetchBanks() async {
    try {
      final res = await ApiClient.get('/banks');
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
              .map((item) => BankAccountModel.fromJson(Map<String, dynamic>.from(item)))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }

  /// Records a customer payment statement
  static Future<bool> recordPayment({
    required int customerId,
    required double amount,
    required String bankType,
    int? bankId,
    String? description,
    String? date,
  }) async {
    final res = await ApiClient.post('/customer-statements', {
      'cus_id': customerId,
      'amount': amount,
      'bank_type': bankType,
      'bank_id': bankId,
      'description': description ?? '',
      'date': date ?? DateTime.now().toIso8601String().split('T')[0],
    });
    return res.isSuccess;
  }

  /// Records a follow-up call log
  static Future<bool> recordCallLog({
    required int customerId,
    required String date,
    required String nextCallDate,
    required String description,
  }) async {
    final res = await ApiClient.post('/call-logs', {
      'cus_id': customerId,
      'date': date,
      'next_call_date': nextCallDate,
      'description': description,
    });
    return res.isSuccess;
  }

  /// Registers a customer on backend /api/customers
  static Future<bool> createCustomer({
    required String name,
    String? phone,
    String? category,
    String? email,
    double balance = 0.0,
    String? address,
  }) async {
    final Map<String, dynamic> body = {
      'name': name.trim(),
      'phone_no': phone?.trim() ?? '',
      'category': (category?.trim().toLowerCase() ?? 'other'),
      'email': email?.trim() ?? '',
      'balance': balance,
      'address': address?.trim() ?? '',
    };

    final res = await ApiClient.post('/customers', body);

    if (res.isSuccess) {
      await fetchCustomers();
      return true;
    }
    return false;
  }

  /// Creates a dispatch order on backend: POST /api/orders
  static Future<Map<String, dynamic>> createDispatchOrder({
    required int customerId,
    required String date,
    double transportCharge = 0.0,
    required List<Map<String, dynamic>> items,
  }) async {
    final Map<String, dynamic> body = {
      'cus_id': customerId,
      'date': date,
      'transport_charge': transportCharge,
      'items': items,
    };

    final res = await ApiClient.post('/orders', body);
    if (res.isSuccess) {
      return {'success': true, 'data': res.data};
    } else {
      return {
        'success': false,
        'message': res.error ?? 'Failed to create dispatch order',
      };
    }
  }
}

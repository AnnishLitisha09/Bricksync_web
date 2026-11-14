import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/models/cursor_model.dart';
import '../../core/models/stock_item.dart';
import '../../core/services/cursor_service.dart';
import '../../core/services/customer_service.dart';
import '../../core/services/fleet_service.dart';
import '../../core/services/stock_service.dart';
import '../../core/stores/customer_store.dart';
import '../../core/stores/stock_store.dart';
import '../../core/theme/app_colors.dart';

class MaterialItemRow {
  String officeName;
  int officeId;
  int? productId;
  String productName;
  String unit;
  double availableQty;
  int? vehicleId;
  String vehicleName;
  double quantity;
  double rate;
  List<int> driverIds;
  List<int> loaderIds;
  double loaderChargePerUnit;
  int? cursorLoadId;
  double? buyPrice;

  MaterialItemRow({
    this.officeName = "Office",
    this.officeId = 1,
    this.productId,
    this.productName = "",
    this.unit = "NOS",
    this.availableQty = 0.0,
    this.vehicleId,
    this.vehicleName = "",
    this.quantity = 0.0,
    this.rate = 0.0,
    List<int>? driverIds,
    List<int>? loaderIds,
    this.loaderChargePerUnit = 0.0,
    this.cursorLoadId,
    this.buyPrice,
  })  : driverIds = driverIds ?? [],
        loaderIds = loaderIds ?? [];

  double get subtotal => quantity * rate;
  double get profit => (rate - (buyPrice ?? 0.0)) * quantity;
}

class MaterialOutwardPage extends StatefulWidget {
  final CustomerItem? initialCustomer;

  const MaterialOutwardPage({
    super.key,
    this.initialCustomer,
  });

  @override
  State<MaterialOutwardPage> createState() => _MaterialOutwardPageState();
}

class _MaterialOutwardPageState extends State<MaterialOutwardPage> {
  CustomerItem? _selectedCustomer;
  DateTime _entryDate = DateTime.now();
  final TextEditingController _transportChargeCtrl = TextEditingController(text: "0");

  final List<MaterialItemRow> _items = [];
  final List<TextEditingController> _qtyControllers = [];
  final List<TextEditingController> _rateControllers = [];
  final List<TextEditingController> _loaderChargeControllers = [];

  bool _isLoadingInitial = true;
  bool _isSubmitting = false;

  bool _cursorMode = false;
  List<CursorLoadItem> _loadedCursorMaterials = [];

  List<CustomerItem> _allCustomers = [];
  List<StockItem> _allStock = [];
  List<VehicleModel> _allVehicles = [];
  List<StaffMember> _allStaff = [];
  List<String> _offices = ["Office", "Thottam"];

  final Set<int> _showAllDriversForItems = {};
  final Set<int> _showAllLoadersForItems = {};

  @override
  void initState() {
    super.initState();
    _selectedCustomer = widget.initialCustomer;
    _addItemRow();
    _loadDependencies();
  }

  void _addItemRow() {
    _items.add(MaterialItemRow(
      officeName: _offices.isNotEmpty ? _offices.first : "Office",
      officeId: 1,
    ));
    _qtyControllers.add(TextEditingController());
    _rateControllers.add(TextEditingController());
    _loaderChargeControllers.add(TextEditingController(text: "0"));
  }

  void _removeItemRow(int index) {
    if (_items.length <= 1) return;
    setState(() {
      _items.removeAt(index);
      _qtyControllers[index].dispose();
      _qtyControllers.removeAt(index);
      _rateControllers[index].dispose();
      _rateControllers.removeAt(index);
      _loaderChargeControllers[index].dispose();
      _loaderChargeControllers.removeAt(index);
    });
  }

  Future<void> _loadDependencies() async {
    setState(() => _isLoadingInitial = true);
    try {
      final results = await Future.wait([
        CustomerService.fetchCustomers(),
        StockService.fetchStock(),
        FleetService.fetchVehicles(),
        StockService.fetchEmployees(),
        StockService.fetchOffices(),
        CursorService.getLoadedMaterials(),
      ]);

      _allCustomers = results[0] as List<CustomerItem>;
      _allStock = results[1] as List<StockItem>;
      _allVehicles = results[2] as List<VehicleModel>;
      _allStaff = StockService.currentStaffMembers;
      final off = results[4] as List<String>;
      if (off.isNotEmpty) _offices = off;
      _loadedCursorMaterials = results[5] as List<CursorLoadItem>;

      // If initial customer provided, ensure we match up with freshest backend data
      if (_selectedCustomer != null) {
        final matched = _allCustomers.where((c) => c.id == _selectedCustomer!.id).toList();
        if (matched.isNotEmpty) {
          _selectedCustomer = matched.first;
        }
      }
    } catch (_) {
      // Fallback from stores
      _allCustomers = customerStore.customers;
      _allStock = stockStore.stock;
      _allVehicles = FleetService.currentVehicles;
      _allStaff = StockService.currentStaffMembers;
    } finally {
      if (mounted) setState(() => _isLoadingInitial = false);
    }
  }

  Future<void> _refreshLoadedMaterials() async {
    try {
      final loads = await CursorService.getLoadedMaterials();
      if (mounted) setState(() => _loadedCursorMaterials = loads);
    } catch (_) {}
  }

  @override
  void dispose() {
    _transportChargeCtrl.dispose();
    for (final c in _qtyControllers) {
      c.dispose();
    }
    for (final c in _rateControllers) {
      c.dispose();
    }
    for (final c in _loaderChargeControllers) {
      c.dispose();
    }
    super.dispose();
  }

  double get _transportCharge => double.tryParse(_transportChargeCtrl.text.trim()) ?? 0.0;

  double get _materialsTotal => _items.fold<double>(0.0, (sum, item) => sum + item.subtotal);

  double get _grandTotal => _materialsTotal + _transportCharge;

  // ─── CUSTOMER SEARCH MODAL ───
  void _openCustomerSelector() {
    String search = "";
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalCtx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final filtered = _allCustomers.where((c) {
            final q = search.toLowerCase().trim();
            if (q.isEmpty) return true;
            return c.name.toLowerCase().contains(q) ||
                c.phone.contains(q) ||
                c.location.toLowerCase().contains(q) ||
                c.id.toString().contains(q);
          }).toList();

          return Container(
            height: MediaQuery.of(context).size.height * 0.78,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                // Modal Handle
                const SizedBox(height: 12),
                Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 14),

                // Title & Count
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Select Customer Account",
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primarySoft,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          "${filtered.length} Clients",
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Search Input
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: TextField(
                      autofocus: true,
                      style: GoogleFonts.outfit(fontSize: 14, color: const Color(0xFF0F172A)),
                      decoration: InputDecoration(
                        icon: const Icon(Icons.search_rounded, size: 20, color: Color(0xFF64748B)),
                        hintText: "Search client name, phone, or location...",
                        hintStyle: GoogleFonts.outfit(fontSize: 13, color: const Color(0xFF94A3B8)),
                        border: InputBorder.none,
                      ),
                      onChanged: (val) => setModalState(() => search = val),
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // Customer List
                Expanded(
                  child: filtered.isEmpty
                      ? Center(
                          child: Text(
                            "No customer matching '$search'",
                            style: GoogleFonts.outfit(color: const Color(0xFF94A3B8), fontSize: 13),
                          ),
                        )
                      : ListView.separated(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          itemCount: filtered.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 6),
                          itemBuilder: (context, i) {
                            final c = filtered[i];
                            final isSelected = _selectedCustomer?.id == c.id;

                            return Material(
                              color: isSelected ? const Color(0xFFEEF2FF) : Colors.transparent,
                              borderRadius: BorderRadius.circular(14),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(14),
                                onTap: () {
                                  setState(() => _selectedCustomer = c);
                                  Navigator.pop(modalCtx);
                                },
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  child: Row(
                                    children: [
                                      CircleAvatar(
                                        radius: 18,
                                        backgroundColor: isSelected
                                            ? AppColors.primary
                                            : const Color(0xFF0F172A).withValues(alpha: 0.06),
                                        child: Text(
                                          c.name.isNotEmpty ? c.name[0].toUpperCase() : 'C',
                                          style: GoogleFonts.outfit(
                                            color: isSelected ? Colors.white : const Color(0xFF0F172A),
                                            fontWeight: FontWeight.w800,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              c.name,
                                              style: GoogleFonts.outfit(
                                                fontSize: 14.5,
                                                fontWeight: FontWeight.w700,
                                                color: const Color(0xFF0F172A),
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              "${c.phone.isNotEmpty ? c.phone : 'No phone'} • ${c.location.isNotEmpty ? c.location : 'Tirupur'}",
                                              style: GoogleFonts.outfit(
                                                fontSize: 11.5,
                                                color: const Color(0xFF64748B),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            c.outstandingBalance > 0
                                                ? "₹${c.outstandingBalance.toStringAsFixed(0)}"
                                                : "Settled",
                                            style: GoogleFonts.outfit(
                                              fontSize: 12.5,
                                              fontWeight: FontWeight.w800,
                                              color: c.outstandingBalance > 0
                                                  ? const Color(0xFFDC2626)
                                                  : const Color(0xFF059669),
                                            ),
                                          ),
                                          Text(
                                            "#${c.id}",
                                            style: GoogleFonts.outfit(
                                              fontSize: 10,
                                              color: const Color(0xFF94A3B8),
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ─── PRODUCT / MATERIAL SEARCH MODAL ───
  void _openMaterialSelector(int itemIndex) {
    final row = _items[itemIndex];
    String search = "";

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalCtx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          // Available stock for selected office (only items with available quantity > 0)
          final availableInOffice = _allStock.where((s) {
            final matchesOffice = s.officeId == row.officeId ||
                s.officeName.toLowerCase().contains(row.officeName.toLowerCase().substring(0, 3));
            final q = search.toLowerCase().trim();
            final matchesSearch = q.isEmpty ||
                s.productName.toLowerCase().contains(q) ||
                s.category.toLowerCase().contains(q);
            final hasStock = s.quantity > 0;
            return matchesOffice && matchesSearch && hasStock;
          }).toList();

          return Container(
            height: MediaQuery.of(context).size.height * 0.72,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                const SizedBox(height: 12),
                Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 14),

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Select Material",
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            "Available stock at plant yard: ${row.officeName}",
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          "${availableInOffice.length} Items",
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFFD97706),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: TextField(
                      autofocus: true,
                      style: GoogleFonts.outfit(fontSize: 14, color: const Color(0xFF0F172A)),
                      decoration: InputDecoration(
                        icon: const Icon(Icons.search_rounded, size: 20, color: Color(0xFF64748B)),
                        hintText: "Type product name (e.g. 6 MOLD, Dalmia...)",
                        hintStyle: GoogleFonts.outfit(fontSize: 13, color: const Color(0xFF94A3B8)),
                        border: InputBorder.none,
                      ),
                      onChanged: (val) => setModalState(() => search = val),
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                Expanded(
                  child: availableInOffice.isEmpty
                      ? Center(
                          child: Text(
                            "No stock found for ${row.officeName}",
                            style: GoogleFonts.outfit(color: const Color(0xFF94A3B8), fontSize: 13),
                          ),
                        )
                      : ListView.separated(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          itemCount: availableInOffice.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 6),
                          itemBuilder: (context, i) {
                            final s = availableInOffice[i];
                            final isSelected = row.productId == s.productId;
                            final isOutOfStock = s.quantity <= 0;

                            return Opacity(
                              opacity: isOutOfStock ? 0.45 : 1.0,
                              child: Material(
                                color: isSelected ? const Color(0xFFEEF2FF) : Colors.transparent,
                                borderRadius: BorderRadius.circular(14),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(14),
                                  onTap: () {
                                    if (isOutOfStock) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text("${s.productName} has 0 stock available in ${row.officeName}"),
                                          backgroundColor: const Color(0xFFDC2626),
                                        ),
                                      );
                                      return;
                                    }
                                    setState(() {
                                      row.productId = s.productId;
                                      row.productName = s.productName;
                                      row.unit = s.unit;
                                      row.availableQty = s.quantity;
                                      row.officeId = s.officeId;
                                      row.officeName = s.officeName;
                                      if (s.price > 0 && row.rate == 0.0) {
                                        row.rate = s.price;
                                        _rateControllers[itemIndex].text = s.price.toStringAsFixed(2);
                                      }
                                    });
                                    Navigator.pop(modalCtx);
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                    child: Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: isSelected ? AppColors.primary : const Color(0xFFF1F5F9),
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: Icon(
                                            Icons.layers_rounded,
                                            size: 18,
                                            color: isSelected ? Colors.white : const Color(0xFF475569),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                s.productName,
                                                style: GoogleFonts.outfit(
                                                  fontSize: 14.5,
                                                  fontWeight: FontWeight.w700,
                                                  color: const Color(0xFF0F172A),
                                                ),
                                              ),
                                              Text(
                                                "${s.category.toUpperCase()} • PROD-${s.productId}",
                                                style: GoogleFonts.outfit(
                                                  fontSize: 11,
                                                  color: const Color(0xFF64748B),
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: s.quantity > 0
                                                    ? const Color(0xFFECFDF5)
                                                    : const Color(0xFFFEF2F2),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                s.quantity > 0
                                                    ? "${s.quantity.toStringAsFixed(0)} ${s.unit}"
                                                    : "OUT OF STOCK",
                                                style: GoogleFonts.outfit(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w800,
                                                  color: s.quantity > 0
                                                    ? const Color(0xFF059669)
                                                    : const Color(0xFFDC2626),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              s.quantity > 0 ? "In Stock" : "Unavailable",
                                              style: GoogleFonts.outfit(
                                                fontSize: 10,
                                                color: s.quantity > 0 ? const Color(0xFF94A3B8) : const Color(0xFFDC2626),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ─── CURSOR LOAD SELECTOR MODAL ───
  void _openCursorLoadSelector(int itemIndex) {
    final row = _items[itemIndex];
    String search = "";

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalCtx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final filtered = _loadedCursorMaterials.where((l) {
            final q = search.toLowerCase().trim();
            if (q.isEmpty) return true;
            return l.productName.toLowerCase().contains(q) ||
                l.cursorName.toLowerCase().contains(q) ||
                l.vehicleNumber.toLowerCase().contains(q) ||
                l.driverName.toLowerCase().contains(q) ||
                l.category.toLowerCase().contains(q);
          }).toList();

          return Container(
            height: MediaQuery.of(context).size.height * 0.78,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                const SizedBox(height: 12),
                Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 14),

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Select Loaded Material",
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            "Materials loaded at quarry ready for dispatch",
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primarySoft,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          "${filtered.length} Loads",
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: TextField(
                      autofocus: true,
                      style: GoogleFonts.outfit(fontSize: 14, color: const Color(0xFF0F172A)),
                      decoration: InputDecoration(
                        icon: const Icon(Icons.search_rounded, size: 20, color: Color(0xFF64748B)),
                        hintText: "Search quarry, material, vehicle, driver...",
                        hintStyle: GoogleFonts.outfit(fontSize: 13, color: const Color(0xFF94A3B8)),
                        border: InputBorder.none,
                      ),
                      onChanged: (val) => setModalState(() => search = val),
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                Expanded(
                  child: filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.inventory_2_outlined, size: 48, color: Color(0xFFCBD5E1)),
                              const SizedBox(height: 12),
                              Text(
                                "No active loaded quarry materials found",
                                style: GoogleFonts.outfit(
                                  color: const Color(0xFF64748B),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                "Record vehicle loading at a cursor first",
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  color: const Color(0xFF94A3B8),
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          itemCount: filtered.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 8),
                          itemBuilder: (context, i) {
                            final load = filtered[i];
                            final isSelected = row.cursorLoadId == load.id;

                            return Material(
                              color: isSelected ? const Color(0xFFEEF2FF) : Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(14),
                                onTap: () {
                                  _selectCursorLoad(load, itemIndex);
                                  Navigator.pop(modalCtx);
                                },
                                child: Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                      color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0),
                                      width: isSelected ? 1.5 : 1.0,
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFFEF3C7),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              load.cursorName.isNotEmpty ? load.cursorName : "Quarry Load #${load.id}",
                                              style: GoogleFonts.outfit(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w800,
                                                color: const Color(0xFFB45309),
                                              ),
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFECFDF5),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              "Avail: ${load.remainingQty.toStringAsFixed(0)} units",
                                              style: GoogleFonts.outfit(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w800,
                                                color: const Color(0xFF059669),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        "${load.productName} (${load.category})",
                                        style: GoogleFonts.outfit(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w800,
                                          color: const Color(0xFF0F172A),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          const Icon(Icons.local_shipping_outlined, size: 14, color: Color(0xFF64748B)),
                                          const SizedBox(width: 4),
                                          Text(
                                            load.vehicleNumber.isNotEmpty ? load.vehicleNumber : "No truck",
                                            style: GoogleFonts.outfit(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF334155),
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          const Icon(Icons.person_outline_rounded, size: 14, color: Color(0xFF64748B)),
                                          const SizedBox(width: 4),
                                          Text(
                                            load.driverName.isNotEmpty ? load.driverName : "No driver",
                                            style: GoogleFonts.outfit(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF334155),
                                            ),
                                          ),
                                          const Spacer(),
                                          Text(
                                            "Buy: ₹${load.pricePerQty.toStringAsFixed(2)}/u",
                                            style: GoogleFonts.outfit(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w800,
                                              color: AppColors.primary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _selectCursorLoad(CursorLoadItem load, int itemIndex) {
    final row = _items[itemIndex];
    setState(() {
      row.cursorLoadId = load.id;
      row.buyPrice = load.pricePerQty;
      row.productName = load.productName;
      row.productId = load.cursorProductId ?? 1;
      row.unit = "units";
      row.availableQty = load.remainingQty;
      row.quantity = load.remainingQty;
      _qtyControllers[itemIndex].text = load.remainingQty.toStringAsFixed(
        load.remainingQty % 1 == 0 ? 0 : 2,
      );

      // Auto-fill vehicle if matching vehicle number is found
      if (load.vehicleNumber.isNotEmpty) {
        final cleanNum = load.vehicleNumber.replaceAll(" ", "").toLowerCase();
        final matchedVeh = _allVehicles.where((v) {
          final vNum = v.number.replaceAll(" ", "").toLowerCase();
          return vNum.contains(cleanNum) || cleanNum.contains(vNum);
        }).toList();

        if (matchedVeh.isNotEmpty) {
          row.vehicleId = matchedVeh.first.id;
          row.vehicleName = "${matchedVeh.first.number} (${matchedVeh.first.name})";
        } else {
          row.vehicleName = load.vehicleNumber;
        }
      }

      // Auto-fill driver if matching driver is found
      if (load.driverId != null && load.driverId! > 0) {
        row.driverIds = [load.driverId!];
      } else if (load.driverName.isNotEmpty) {
        final cleanDriver = load.driverName.trim().toLowerCase();
        final matchedStaff = _allStaff.where((s) {
          return s.displayName.trim().toLowerCase() == cleanDriver;
        }).toList();
        if (matchedStaff.isNotEmpty) {
          row.driverIds = [matchedStaff.first.id];
        }
      }

      // Auto-fill loader/unload charge if quarry loading charge was specified
      if (load.hasLoadingCharge && load.loadingChargePerUnit > 0) {
        row.loaderChargePerUnit = load.loadingChargePerUnit;
        _loaderChargeControllers[itemIndex].text = load.loadingChargePerUnit.toStringAsFixed(2);
      }

      // Auto-fill customer if cursor load already recorded a customer
      if (_selectedCustomer == null && load.customerId != null && load.customerId! > 0) {
        final matchedCus = _allCustomers.where((c) => c.id == load.customerId).toList();
        if (matchedCus.isNotEmpty) {
          _selectedCustomer = matchedCus.first;
        }
      }

      // Auto-fill date if available
      if (load.date.isNotEmpty) {
        try {
          _entryDate = DateTime.parse(load.date);
        } catch (_) {}
      }
    });
  }

  // ─── VEHICLE SELECTOR MODAL ───
  void _openVehicleSelector(int itemIndex) {
    final row = _items[itemIndex];
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (modalCtx) => Container(
        height: MediaQuery.of(context).size.height * 0.6,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFCBD5E1),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 14),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Assign Transport Vehicle",
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  Text(
                    "${_allVehicles.length} Trucks",
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            Expanded(
              child: ListView.separated(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                itemCount: _allVehicles.length + 1,
                separatorBuilder: (_, _) => const SizedBox(height: 6),
                itemBuilder: (context, i) {
                  if (i == 0) {
                    return ListTile(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      leading: const Icon(Icons.not_interested_rounded, color: Color(0xFF94A3B8)),
                      title: Text(
                        "No Vehicle (Self / Customer Pickup)",
                        style: GoogleFonts.outfit(fontSize: 13.5, fontWeight: FontWeight.w600),
                      ),
                      onTap: () {
                        setState(() {
                          row.vehicleId = null;
                          row.vehicleName = "";
                        });
                        Navigator.pop(modalCtx);
                      },
                    );
                  }

                  final v = _allVehicles[i - 1];
                  final isSelected = row.vehicleId == v.id;

                  return Material(
                    color: isSelected ? const Color(0xFFEEF2FF) : Colors.transparent,
                    borderRadius: BorderRadius.circular(14),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(14),
                      onTap: () {
                        setState(() {
                          row.vehicleId = v.id;
                          row.vehicleName = "${v.number} (${v.name})";
                        });
                        Navigator.pop(modalCtx);
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isSelected ? AppColors.primary : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(
                                Icons.local_shipping_rounded,
                                size: 18,
                                color: isSelected ? Colors.white : const Color(0xFF475569),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    v.number,
                                    style: GoogleFonts.outfit(
                                      fontSize: 14.5,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                  Text(
                                    v.name,
                                    style: GoogleFonts.outfit(
                                      fontSize: 12,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: v.isActive ? const Color(0xFFECFDF5) : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                v.isActive ? "ACTIVE" : "IDLE",
                                style: GoogleFonts.outfit(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  color: v.isActive ? const Color(0xFF059669) : const Color(0xFF64748B),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── DATE PICKER ───
  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _entryDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppColors.primary,
            onPrimary: Colors.white,
            onSurface: Color(0xFF0F172A),
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() => _entryDate = picked);
    }
  }

  // ─── SUBMIT MATERIAL OUTWARD ───
  Future<void> _submitMaterialOutward() async {
    if (_selectedCustomer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please select a customer account first"),
          backgroundColor: Color(0xFFDC2626),
        ),
      );
      _openCustomerSelector();
      return;
    }

    for (int i = 0; i < _items.length; i++) {
      final item = _items[i];
      if (_cursorMode || item.cursorLoadId != null) {
        if (item.cursorLoadId == null || item.cursorLoadId == 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("Please select a cursor loaded material for Item #${i + 1}"),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
          _openCursorLoadSelector(i);
          return;
        }
        if (item.quantity <= 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("Please enter a valid quantity for Item #${i + 1}"),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
          return;
        }
        if (item.availableQty <= 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                "${item.productName.isNotEmpty ? item.productName : 'Item #${i + 1}'} has 0 available load quantity.",
              ),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
          return;
        }
        if (item.quantity > item.availableQty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                "Requested ${item.quantity.toStringAsFixed(0)} exceeds available cursor load quantity of ${item.availableQty.toStringAsFixed(0)}.",
              ),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
          return;
        }
      } else {
        if (item.productId == null || item.productId == 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("Please select a material for Item #${i + 1}"),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
          _openMaterialSelector(i);
          return;
        }
        if (item.quantity <= 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("Please enter a valid quantity for Item #${i + 1}"),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
          return;
        }
        if (item.availableQty <= 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                "${item.productName.isNotEmpty ? item.productName : 'Item #${i + 1}'} has 0 stock available in ${item.officeName}. Please select another item.",
              ),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
          return;
        }
        if (item.quantity > item.availableQty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                "Insufficient stock for ${item.productName}. Requested ${item.quantity.toStringAsFixed(0)} ${item.unit}, but only ${item.availableQty.toStringAsFixed(0)} available in ${item.officeName}.",
              ),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
          return;
        }
      }
      if (item.rate < 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Please enter a valid rate for Item #${i + 1}"),
            backgroundColor: const Color(0xFFDC2626),
          ),
        );
        return;
      }
    }

    setState(() => _isSubmitting = true);

    try {
      final dateStr =
          "${_entryDate.year}-${_entryDate.month.toString().padLeft(2, '0')}-${_entryDate.day.toString().padLeft(2, '0')}";

      final itemsPayload = _items.map((it) {
        return {
          'product': it.productName,
          'office_id': it.officeId,
          'material_id': it.productId,
          'quantity': it.quantity,
          'price': it.rate,
          if (it.vehicleId != null && it.vehicleId! > 0) 'vehicle_id': it.vehicleId,
          'driver_ids': it.driverIds.where((id) => id > 0).toList(),
          'loader_ids': it.loaderIds.where((id) => id > 0).toList(),
          'loader_charge_per_unit': it.loaderChargePerUnit,
          if (it.cursorLoadId != null && it.cursorLoadId! > 0) 'cursor_load_id': it.cursorLoadId,
          if (it.buyPrice != null) 'buy_price': it.buyPrice,
        };
      }).toList();

      final res = await customerStore.createDispatchOrder(
        customerId: _selectedCustomer!.id,
        date: dateStr,
        transportCharge: _transportCharge,
        items: itemsPayload,
      );

      if (!mounted) return;

      if (res['success'] == true) {
        // Automatically refresh stock & production stores
        await Future.wait([
          stockStore.fetchStockData(force: true),
          customerStore.fetchCustomers(force: true),
        ]);

        if (!mounted) return;

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              "Material Outward of ₹${_grandTotal.toStringAsFixed(0)} successfully dispatched to ${_selectedCustomer!.name}!",
            ),
            backgroundColor: const Color(0xFF059669),
          ),
        );
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res['message']?.toString() ?? "Failed to create dispatch order"),
            backgroundColor: const Color(0xFFDC2626),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Dispatch error: $e"),
          backgroundColor: const Color(0xFFDC2626),
        ),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final formattedDate =
        "${_entryDate.day.toString().padLeft(2, '0')}/${_entryDate.month.toString().padLeft(2, '0')}/${_entryDate.year}";

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  "Material ",
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  "Outward",
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            Text(
              "Dispatch order & ledger synchronization",
              style: GoogleFonts.outfit(
                fontSize: 11,
                color: AppColors.textMuted,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFECFDF5),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFA7F3D0)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: Color(0xFF059669),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  "LIVE DISPATCH",
                  style: GoogleFonts.outfit(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF059669),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: _isLoadingInitial
          ? const Center(
              child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primary),
            )
          : SafeArea(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ─── CURSOR PROCUREMENT MODE TOGGLE ───
                    Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: _cursorMode ? const Color(0xFFEEF2FF) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: _cursorMode ? AppColors.primary : AppColors.border,
                          width: _cursorMode ? 1.5 : 1.0,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0F172A).withValues(alpha: 0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: _cursorMode ? AppColors.primary : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              Icons.account_tree_rounded,
                              size: 20,
                              color: _cursorMode ? Colors.white : const Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      "Cursor Procurement Mode",
                                      style: GoogleFonts.outfit(
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.w800,
                                        color: _cursorMode ? AppColors.primary : const Color(0xFF0F172A),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                      decoration: BoxDecoration(
                                        color: _cursorMode ? AppColors.primary : const Color(0xFFE2E8F0),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        _cursorMode ? "CURSOR" : "OFF",
                                        style: GoogleFonts.outfit(
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w800,
                                          color: _cursorMode ? Colors.white : const Color(0xFF64748B),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                Text(
                                  _cursorMode
                                      ? "Dispatch from quarry load with live profit tracking"
                                      : "Standard dispatch from company office stock inventory",
                                  style: GoogleFonts.outfit(
                                    fontSize: 11,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Switch.adaptive(
                            value: _cursorMode,
                            activeColor: AppColors.primary,
                            onChanged: (val) {
                              setState(() {
                                _cursorMode = val;
                                if (!_cursorMode) {
                                  for (final itm in _items) {
                                    itm.cursorLoadId = null;
                                    itm.buyPrice = null;
                                  }
                                }
                              });
                            },
                          ),
                        ],
                      ),
                    ),

                    // ─── 1. DISPATCH LOGISTICS (DATE & CUSTOMER ACCOUNT) ───
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.border),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0F172A).withValues(alpha: 0.02),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                "LOGISTICS & RECIPIENT",
                                style: GoogleFonts.outfit(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.6,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                              GestureDetector(
                                onTap: _pickDate,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.calendar_today_rounded, size: 13, color: AppColors.primary),
                                      const SizedBox(width: 5),
                                      Text(
                                        formattedDate,
                                        style: GoogleFonts.outfit(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color: const Color(0xFF0F172A),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),

                          // Customer Selector Box
                          _buildFieldLabel("SELECT CUSTOMER ACCOUNT"),
                          const SizedBox(height: 6),
                          GestureDetector(
                            onTap: _openCustomerSelector,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              decoration: BoxDecoration(
                                color: _selectedCustomer != null
                                    ? const Color(0xFFF8FAFC)
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: _selectedCustomer != null
                                      ? AppColors.primary.withValues(alpha: 0.5)
                                      : const Color(0xFFCBD5E1),
                                  width: 1.2,
                                ),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundColor: _selectedCustomer != null
                                        ? AppColors.primary
                                        : const Color(0xFFE2E8F0),
                                    child: Icon(
                                      Icons.person_rounded,
                                      size: 18,
                                      color: _selectedCustomer != null
                                          ? Colors.white
                                          : const Color(0xFF64748B),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          _selectedCustomer != null
                                              ? _selectedCustomer!.name
                                              : "Tap to select customer...",
                                          style: GoogleFonts.outfit(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w800,
                                            color: _selectedCustomer != null
                                                ? const Color(0xFF0F172A)
                                                : const Color(0xFF94A3B8),
                                          ),
                                        ),
                                        if (_selectedCustomer != null)
                                          Text(
                                            "${_selectedCustomer!.phone.isNotEmpty ? _selectedCustomer!.phone : 'No phone'} • Account #${_selectedCustomer!.id}",
                                            style: GoogleFonts.outfit(
                                              fontSize: 11,
                                              color: const Color(0xFF64748B),
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      _selectedCustomer != null ? "Change" : "Browse",
                                      style: GoogleFonts.outfit(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),

                          const SizedBox(height: 14),

                          // Transport Charge
                          _buildFieldLabel("TRANSPORT CHARGE (₹) (OPTIONAL)"),
                          const SizedBox(height: 6),
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFCBD5E1), width: 1.1),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: TextField(
                              controller: _transportChargeCtrl,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              style: GoogleFonts.outfit(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF0F172A),
                              ),
                              decoration: const InputDecoration(
                                prefixText: "₹ ",
                                prefixStyle: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF64748B),
                                ),
                                border: InputBorder.none,
                                hintText: "0",
                              ),
                              onChanged: (_) => setState(() {}),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ─── 2. MATERIAL ITEMS SECTION ───
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "DISPATCH MATERIAL ITEMS (${_items.length})",
                          style: GoogleFonts.outfit(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.6,
                            color: const Color(0xFF475569),
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            setState(() => _addItemRow());
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: AppColors.primarySoft,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.add_rounded, size: 14, color: AppColors.primary),
                                const SizedBox(width: 4),
                                Text(
                                  "Add Item",
                                  style: GoogleFonts.outfit(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // List of Material Item Cards
                    for (int i = 0; i < _items.length; i++) _buildItemCard(i),

                    const SizedBox(height: 12),

                    // Add Another Item Button
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 46),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        side: BorderSide(color: AppColors.primary.withValues(alpha: 0.4), width: 1.2),
                        backgroundColor: Colors.white,
                      ),
                      onPressed: () => setState(() => _addItemRow()),
                      icon: const Icon(Icons.add_rounded, size: 18, color: AppColors.primary),
                      label: Text(
                        "Add Another Material Item",
                        style: GoogleFonts.outfit(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),

                    const SizedBox(height: 18),

                    // ─── 3. LIVE SUMMARY TOTAL CARD ───
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0F172A).withValues(alpha: 0.15),
                            blurRadius: 14,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                "Materials Total (${_items.length} items)",
                                style: GoogleFonts.outfit(
                                  fontSize: 12.5,
                                  color: const Color(0xFF94A3B8),
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                "₹ ${_materialsTotal.toStringAsFixed(2)}",
                                style: GoogleFonts.outfit(
                                  fontSize: 14,
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          if (_transportCharge > 0) ...[
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  "Transport Logistics",
                                  style: GoogleFonts.outfit(
                                    fontSize: 12.5,
                                    color: const Color(0xFF94A3B8),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  "+ ₹ ${_transportCharge.toStringAsFixed(2)}",
                                  style: GoogleFonts.outfit(
                                    fontSize: 14,
                                    color: const Color(0xFF38BDF8),
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ],
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 10),
                            child: Divider(color: Color(0xFF334155), height: 1),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    "GRAND OUTWARD TOTAL",
                                    style: GoogleFonts.outfit(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF94A3B8),
                                      letterSpacing: 0.6,
                                    ),
                                  ),
                                  Text(
                                    "Auto debits ledger",
                                    style: GoogleFonts.outfit(
                                      fontSize: 10,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                "₹ ${_grandTotal.toStringAsFixed(2)}",
                                style: GoogleFonts.outfit(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ─── 4. CONFIRM DISPATCH ACTION BUTTON ───
                    GestureDetector(
                      onTap: _isSubmitting ? null : _submitMaterialOutward,
                      child: Container(
                        width: double.infinity,
                        height: 52,
                        decoration: BoxDecoration(
                          gradient: AppColors.buttonGradient,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.35),
                              blurRadius: 14,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Center(
                          child: _isSubmitting
                              ? Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.2,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Text(
                                      "Confirming Dispatch...",
                                      style: GoogleFonts.outfit(
                                        color: Colors.white,
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(
                                      Icons.local_shipping_rounded,
                                      color: Colors.white,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      "Confirm Material Outward",
                                      style: GoogleFonts.outfit(
                                        color: Colors.white,
                                        fontSize: 15,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildItemCard(int index) {
    final item = _items[index];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Item Number and Delete
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFEEF2FF),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  "Material Item #${index + 1}",
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
              ),
              if (_items.length > 1)
                IconButton(
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  icon: const Icon(Icons.delete_outline_rounded, color: Color(0xFFDC2626), size: 20),
                  onPressed: () => _removeItemRow(index),
                ),
            ],
          ),
          const SizedBox(height: 12),

          if (!_cursorMode) ...[
            // Dispatch Office Selector (Office / Thottam)
            _buildFieldLabel("DISPATCH PLANT YARD"),
            const SizedBox(height: 6),
            Row(
              children: [
                for (final off in _offices) ...[
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          item.officeName = off;
                          item.officeId = off.toLowerCase().contains("thot") ? 2 : 1;
                          // Reset product if office changed
                          item.productId = null;
                          item.productName = "";
                          item.availableQty = 0;
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 9),
                        decoration: BoxDecoration(
                          color: item.officeName.toLowerCase() == off.toLowerCase()
                              ? AppColors.primarySoft
                              : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: item.officeName.toLowerCase() == off.toLowerCase()
                                ? AppColors.primary
                                : const Color(0xFFCBD5E1),
                          ),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          off,
                          style: GoogleFonts.outfit(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                            color: item.officeName.toLowerCase() == off.toLowerCase()
                                ? AppColors.primary
                                : const Color(0xFF475569),
                          ),
                        ),
                      ),
                    ),
                  ),
                  if (off != _offices.last) const SizedBox(width: 8),
                ],
              ],
            ),

            const SizedBox(height: 12),

            // Material Product Selector
            _buildFieldLabel("SELECT MATERIAL"),
            const SizedBox(height: 6),
            GestureDetector(
              onTap: () => _openMaterialSelector(index),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                decoration: BoxDecoration(
                  color: item.productId != null ? const Color(0xFFF8FAFC) : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: item.productId != null
                        ? AppColors.primary.withValues(alpha: 0.5)
                        : const Color(0xFFCBD5E1),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.layers_outlined,
                      size: 18,
                      color: item.productId != null ? AppColors.primary : const Color(0xFF94A3B8),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.productName.isNotEmpty ? item.productName : "Choose brick / product...",
                            style: GoogleFonts.outfit(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                              color: item.productName.isNotEmpty
                                  ? const Color(0xFF0F172A)
                                  : const Color(0xFF94A3B8),
                            ),
                          ),
                          if (item.productName.isNotEmpty)
                            Text(
                              "Available: ${item.availableQty.toStringAsFixed(0)} ${item.unit}",
                              style: GoogleFonts.outfit(
                                fontSize: 11,
                                color: const Color(0xFF059669),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                        ],
                      ),
                    ),
                    const Icon(Icons.arrow_drop_down_rounded, color: Color(0xFF64748B)),
                  ],
                ),
              ),
            ),
          ] else ...[
            // Cursor Loaded Material Selector
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildFieldLabel("CURSOR LOADED MATERIAL"),
                GestureDetector(
                  onTap: _refreshLoadedMaterials,
                  child: Text(
                    "Reload (${_loadedCursorMaterials.length})",
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            GestureDetector(
              onTap: () => _openCursorLoadSelector(index),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                decoration: BoxDecoration(
                  color: item.cursorLoadId != null ? const Color(0xFFEEF2FF) : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: item.cursorLoadId != null
                        ? AppColors.primary
                        : const Color(0xFFCBD5E1),
                    width: item.cursorLoadId != null ? 1.5 : 1.0,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.local_shipping_rounded,
                      size: 20,
                      color: item.cursorLoadId != null ? AppColors.primary : const Color(0xFF94A3B8),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.cursorLoadId != null
                                ? "${item.productName} • ${item.availableQty.toStringAsFixed(0)} units available"
                                : "Select Loaded Material from Cursor...",
                            style: GoogleFonts.outfit(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w800,
                              color: item.cursorLoadId != null
                                  ? const Color(0xFF0F172A)
                                  : const Color(0xFF94A3B8),
                            ),
                          ),
                          if (item.cursorLoadId != null)
                            Text(
                              "Quarry Buy Rate: ₹${item.buyPrice?.toStringAsFixed(2) ?? '0.00'}/unit | Veh: ${item.vehicleName.isNotEmpty ? item.vehicleName : 'Assigned'}",
                              style: GoogleFonts.outfit(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const Icon(Icons.arrow_drop_down_rounded, color: Color(0xFF64748B)),
                  ],
                ),
              ),
            ),
          ],

          const SizedBox(height: 12),

          // Vehicle Selector
          _buildFieldLabel("DISPATCH VEHICLE (OPTIONAL)"),
          const SizedBox(height: 6),
          GestureDetector(
            onTap: () => _openVehicleSelector(index),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: item.vehicleId != null ? const Color(0xFFF8FAFC) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFCBD5E1)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.local_shipping_outlined, size: 18, color: Color(0xFF64748B)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      item.vehicleName.isNotEmpty ? item.vehicleName : "Assign transport truck...",
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: item.vehicleName.isNotEmpty
                            ? const Color(0xFF0F172A)
                            : const Color(0xFF94A3B8),
                      ),
                    ),
                  ),
                  const Icon(Icons.arrow_drop_down_rounded, color: Color(0xFF64748B)),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Qty & Rate
          Row(
            children: [
              // Quantity
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildFieldLabel("QUANTITY (${item.unit})"),
                    const SizedBox(height: 6),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFCBD5E1)),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: TextField(
                        controller: _qtyControllers[index],
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF0F172A),
                        ),
                        decoration: InputDecoration(
                          hintText: "0",
                          hintStyle: GoogleFonts.outfit(color: const Color(0xFF94A3B8)),
                          border: InputBorder.none,
                          suffixText: item.unit,
                          suffixStyle: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                        ),
                        onChanged: (val) {
                          setState(() {
                            item.quantity = double.tryParse(val.trim()) ?? 0.0;
                          });
                        },
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),

              // Rate (₹)
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildFieldLabel(_cursorMode ? "SELLING RATE (₹)" : "RATE (₹)"),
                    const SizedBox(height: 6),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFCBD5E1)),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: TextField(
                        controller: _rateControllers[index],
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF0F172A),
                        ),
                        decoration: InputDecoration(
                          prefixText: "₹ ",
                          prefixStyle: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF64748B)),
                          hintText: "0.00",
                          hintStyle: GoogleFonts.outfit(color: const Color(0xFF94A3B8)),
                          border: InputBorder.none,
                        ),
                        onChanged: (val) {
                          setState(() {
                            item.rate = double.tryParse(val.trim()) ?? 0.0;
                          });
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Live Margin & Profit Banner in Cursor Mode
          if (_cursorMode && item.cursorLoadId != null && item.buyPrice != null) ...[
            Builder(
              builder: (context) {
                final buyRate = item.buyPrice ?? 0.0;
                final sellRate = item.rate;
                final margin = sellRate - buyRate;
                final profit = margin * item.quantity;
                final isProfitable = profit >= 0;

                return Container(
                  margin: const EdgeInsets.only(top: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isProfitable ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isProfitable ? const Color(0xFFA7F3D0) : const Color(0xFFFECACA),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "BUY: ₹${buyRate.toStringAsFixed(1)}   SELL: ₹${sellRate.toStringAsFixed(1)}",
                            style: GoogleFonts.outfit(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF475569),
                            ),
                          ),
                          Text(
                            "MARGIN: ${margin >= 0 ? '+' : ''}₹${margin.toStringAsFixed(2)} / unit",
                            style: GoogleFonts.outfit(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                              color: isProfitable ? const Color(0xFF059669) : const Color(0xFFDC2626),
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isProfitable ? const Color(0xFF059669) : const Color(0xFFDC2626),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          "Profit: ₹${profit.toStringAsFixed(2)}",
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],

          // Subtotal display
          if (item.subtotal > 0) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Item #${index + 1} Subtotal:",
                    style: GoogleFonts.outfit(fontSize: 11.5, color: const Color(0xFF64748B)),
                  ),
                  Text(
                    "₹ ${item.subtotal.toStringAsFixed(2)}",
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 10),

          // ─── STAFF & HANDLING CHARGES (ALWAYS EXPANDED) ───
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEEF2FF),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.people_alt_rounded, size: 15, color: AppColors.primary),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _cursorMode ? "STAFF & UNLOAD CHARGES" : "STAFF & HANDLING CHARGES",
                          style: GoogleFonts.outfit(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.6,
                            color: const Color(0xFF334155),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      "Optional",
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // ── DRIVERS SECTION (MULTIPLE SELECTABLE CHIPS) ──
                Builder(
                  builder: (context) {
                    final designatedDrivers = _allStaff
                        .where((s) => (s.role ?? '').toLowerCase().contains('driver'))
                        .toList();
                    final showAllD = _showAllDriversForItems.contains(index) || designatedDrivers.isEmpty;
                    final displayDrivers = showAllD
                        ? _allStaff
                        : [
                            ...designatedDrivers,
                            ..._allStaff.where((s) => item.driverIds.contains(s.id) && !designatedDrivers.contains(s)),
                          ];

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildFieldLabel("DRIVER(S)"),
                            if (item.driverIds.isNotEmpty)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEEF2FF),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  "${item.driverIds.length} Selected",
                                  style: GoogleFonts.outfit(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        _allStaff.isEmpty
                            ? Text(
                                "No staff members available",
                                style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF94A3B8)),
                              )
                            : Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  for (final st in displayDrivers)
                                    _buildSelectableChip(
                                      label: st.displayName,
                                      isSelected: item.driverIds.contains(st.id),
                                      activeColor: const Color(0xFF4F46E5), // Indigo
                                      onTap: () {
                                        setState(() {
                                          if (item.driverIds.contains(st.id)) {
                                            item.driverIds.remove(st.id);
                                          } else {
                                            item.driverIds.add(st.id);
                                          }
                                        });
                                      },
                                    ),
                                  if (_allStaff.length > designatedDrivers.length && designatedDrivers.isNotEmpty)
                                    _buildActionChip(
                                      label: showAllD ? "Drivers Only" : "+ All (${_allStaff.length})",
                                      icon: showAllD ? Icons.filter_list_off_rounded : Icons.groups_outlined,
                                      onTap: () {
                                        setState(() {
                                          if (showAllD) {
                                            _showAllDriversForItems.remove(index);
                                          } else {
                                            _showAllDriversForItems.add(index);
                                          }
                                        });
                                      },
                                    ),
                                ],
                              ),
                      ],
                    );
                  },
                ),

                const SizedBox(height: 16),

                // ── LOADERS / LABOR SECTION (MULTIPLE SELECTABLE CHIPS) ──
                Builder(
                  builder: (context) {
                    final designatedLoaders = _allStaff
                        .where((s) => (s.role ?? '').toLowerCase().contains('loader') || (s.role ?? '').toLowerCase().contains('labour') || (s.role ?? '').toLowerCase().contains('labor'))
                        .toList();
                    final showAllL = _showAllLoadersForItems.contains(index) || designatedLoaders.isEmpty;
                    final displayLoaders = showAllL
                        ? _allStaff
                        : [
                            ...designatedLoaders,
                            ..._allStaff.where((s) => item.loaderIds.contains(s.id) && !designatedLoaders.contains(s)),
                          ];

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildFieldLabel("LOADER(S) / LABOR"),
                            if (item.loaderIds.isNotEmpty)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFECFDF5),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  "${item.loaderIds.length} Selected",
                                  style: GoogleFonts.outfit(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF059669),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        _allStaff.isEmpty
                            ? Text(
                                "No staff members available",
                                style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF94A3B8)),
                              )
                            : Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  for (final st in displayLoaders)
                                    _buildSelectableChip(
                                      label: st.displayName,
                                      isSelected: item.loaderIds.contains(st.id),
                                      activeColor: const Color(0xFF059669), // Emerald
                                      onTap: () {
                                        setState(() {
                                          if (item.loaderIds.contains(st.id)) {
                                            item.loaderIds.remove(st.id);
                                          } else {
                                            item.loaderIds.add(st.id);
                                          }
                                        });
                                      },
                                    ),
                                  if (_allStaff.length > designatedLoaders.length && designatedLoaders.isNotEmpty)
                                    _buildActionChip(
                                      label: showAllL ? "Loaders Only" : "+ All (${_allStaff.length})",
                                      icon: showAllL ? Icons.filter_list_off_rounded : Icons.groups_outlined,
                                      onTap: () {
                                        setState(() {
                                          if (showAllL) {
                                            _showAllLoadersForItems.remove(index);
                                          } else {
                                            _showAllLoadersForItems.add(index);
                                          }
                                        });
                                      },
                                    ),
                                ],
                              ),
                      ],
                    );
                  },
                ),

                const SizedBox(height: 16),

                // ── LOADER CHARGE PER UNIT ──
                _buildFieldLabel(_cursorMode ? "UNLOAD CHARGE / UNIT (₹)" : "LOADER / UNIT CHARGE (₹)"),
                const SizedBox(height: 6),
                Container(
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFCBD5E1)),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: TextField(
                    controller: _loaderChargeControllers[index],
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    style: GoogleFonts.outfit(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF0F172A),
                    ),
                    decoration: InputDecoration(
                      prefixText: "₹ ",
                      prefixStyle: GoogleFonts.outfit(
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF64748B),
                        fontSize: 13.5,
                      ),
                      hintText: "0.00",
                      hintStyle: GoogleFonts.outfit(color: const Color(0xFF94A3B8)),
                      border: InputBorder.none,
                    ),
                    onChanged: (val) {
                      setState(() {
                        item.loaderChargePerUnit = double.tryParse(val.trim()) ?? 0.0;
                      });
                    },
                  ),
                ),
                if (item.loaderChargePerUnit > 0 && item.quantity > 0) ...[
                  const SizedBox(height: 6),
                  Builder(
                    builder: (context) {
                      final totalWage = item.loaderChargePerUnit * item.quantity;
                      final perLoader = item.loaderIds.isNotEmpty ? totalWage / item.loaderIds.length : totalWage;
                      return Text(
                        "Total Unload Wage: ₹${totalWage.toStringAsFixed(2)}${item.loaderIds.isNotEmpty ? ' (₹${perLoader.toStringAsFixed(2)} each for ${item.loaderIds.length} loaders)' : ''}",
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF059669),
                        ),
                      );
                    },
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSelectableChip({
    required String label,
    required bool isSelected,
    required Color activeColor,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
          decoration: BoxDecoration(
            color: isSelected ? activeColor : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? activeColor : const Color(0xFFCBD5E1),
              width: isSelected ? 1.4 : 1.0,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: activeColor.withValues(alpha: 0.28),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : [
                    BoxShadow(
                      color: const Color(0xFF0F172A).withValues(alpha: 0.02),
                      blurRadius: 3,
                      offset: const Offset(0, 1),
                    ),
                  ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isSelected ? Icons.check_circle_rounded : Icons.add_circle_outline_rounded,
                size: 14,
                color: isSelected ? Colors.white : const Color(0xFF94A3B8),
              ),
              const SizedBox(width: 5),
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? Colors.white : const Color(0xFF334155),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionChip({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 14, color: const Color(0xFF64748B)),
              const SizedBox(width: 4),
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF475569),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFieldLabel(String label) {
    return Text(
      label,
      style: GoogleFonts.outfit(
        fontSize: 10.5,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.5,
        color: const Color(0xFF64748B),
      ),
    );
  }
}

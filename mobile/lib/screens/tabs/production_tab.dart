import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/models/stock_item.dart';
import '../../core/models/production_log_item.dart';
import '../../core/services/stock_service.dart';
import '../../core/stores/stock_store.dart';
import '../../core/theme/app_colors.dart';
import '../pages/new_production_entry_page.dart';

class ProductionTab extends StatefulWidget {
  const ProductionTab({super.key});

  @override
  State<ProductionTab> createState() => _ProductionTabState();
}

class _ProductionTabState extends State<ProductionTab> {
  // Master Tab: "stock" (Stock Inventory) or "history" (Production History)
  String _activeMasterTab = "stock";

  // Stock Inventory Filters
  String _selectedStoreFilter = "all"; // "all", "office", "thottam"
  String _selectedCategory = "all"; // "all", "sand", "bricks", "cement"
  String _stockSearchQuery = "";
  final TextEditingController _stockSearchController = TextEditingController();

  // Production History Filters
  String _historyOfficeFilter = "all"; // "all", "office", "thottam"
  String _historyTimeRange = "all"; // "all", "today", "week", "month"
  String _historySearchQuery = "";
  final TextEditingController _historySearchController = TextEditingController();

  bool get _isLoading => stockStore.loading && stockStore.stock.isEmpty;
  bool get _isHistoryLoading => stockStore.historyLoading && stockStore.history.isEmpty;

  @override
  void initState() {
    super.initState();
    stockStore.addListener(_onStoreUpdated);
    _loadAllData();
  }

  void _onStoreUpdated() {
    if (mounted) setState(() {});
  }

  Future<void> _loadAllData() async {
    await stockStore.refreshAll(force: true);
  }

  Future<void> _loadHistoryData() async {
    await stockStore.fetchProductionHistory(force: true);
  }

  List<StockItem> get _filteredStockItems {
    return stockStore.getFilteredItems(
      filter: _selectedStoreFilter,
      category: _selectedCategory,
      searchQuery: _stockSearchQuery,
    );
  }

  List<ProductionLogItem> get _filteredHistoryItems {
    return stockStore.getFilteredHistory(
      office: _historyOfficeFilter,
      timeRange: _historyTimeRange,
      searchQuery: _historySearchQuery,
    );
  }

  void _navigateToNewProductionEntry() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => NewProductionEntryPage(
          onSaved: () async {
            await stockStore.refreshAll(force: true);
          },
        ),
      ),
    );
  }

  String _getCategoryLabel(String cat) {
    switch (cat.toLowerCase()) {
      case "sand":
        return "Sand";
      case "bricks":
      case "brick":
        return "Brick";
      case "cement":
        return "Cement";
      default:
        return "Filter";
    }
  }

  void _showCategoryFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final sandCount = StockService.getFilteredItems(
              filter: _selectedStoreFilter,
              category: "sand",
            ).length;

            final brickCount = StockService.getFilteredItems(
              filter: _selectedStoreFilter,
              category: "bricks",
            ).length;

            final cementCount = StockService.getFilteredItems(
              filter: _selectedStoreFilter,
              category: "cement",
            ).length;

            final allCatCount = StockService.getFilteredItems(
              filter: _selectedStoreFilter,
              category: "all",
            ).length;

            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: const EdgeInsets.only(left: 20, right: 20, top: 12, bottom: 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Filter by Category",
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            "Select material to filter inventory",
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                      if (_selectedCategory != "all")
                        TextButton(
                          onPressed: () {
                            setState(() => _selectedCategory = "all");
                            Navigator.pop(context);
                          },
                          child: Text(
                            "Reset",
                            style: GoogleFonts.outfit(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildCategoryOption(
                    title: "All Materials",
                    subtitle: "Show sand, brick, cement & all products",
                    categoryKey: "all",
                    icon: Icons.grid_view_rounded,
                    count: allCatCount,
                    isSelected: _selectedCategory == "all",
                    onTap: () {
                      setState(() => _selectedCategory = "all");
                      Navigator.pop(context);
                    },
                  ),
                  const SizedBox(height: 8),
                  _buildCategoryOption(
                    title: "Bricks (Manufactured)",
                    subtitle: "6 Mold, 8 Mold, 9 Mold, Hollow bricks",
                    categoryKey: "bricks",
                    icon: Icons.view_in_ar_rounded,
                    count: brickCount,
                    isSelected: _selectedCategory == "bricks",
                    onTap: () {
                      setState(() => _selectedCategory = "bricks");
                      Navigator.pop(context);
                    },
                  ),
                  const SizedBox(height: 8),
                  _buildCategoryOption(
                    title: "Cement",
                    subtitle: "OPC 53, Maha HD, Dalmia RCF bags",
                    categoryKey: "cement",
                    icon: Icons.all_inbox_rounded,
                    count: cementCount,
                    isSelected: _selectedCategory == "cement",
                    onTap: () {
                      setState(() => _selectedCategory = "cement");
                      Navigator.pop(context);
                    },
                  ),
                  const SizedBox(height: 8),
                  _buildCategoryOption(
                    title: "Sand & Raw Materials",
                    subtitle: "Medaman, Raff stone, Dust, Chips",
                    categoryKey: "sand",
                    icon: Icons.landscape_rounded,
                    count: sandCount,
                    isSelected: _selectedCategory == "sand",
                    onTap: () {
                      setState(() => _selectedCategory = "sand");
                      Navigator.pop(context);
                    },
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildCategoryOption({
    required String title,
    required String subtitle,
    required String categoryKey,
    required IconData icon,
    required int count,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primarySoft : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color: isSelected ? Colors.white : AppColors.textSecondary,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.outfit(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary : AppColors.backgroundSecondary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                "$count",
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? Colors.white : AppColors.textSecondary,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
              color: isSelected ? AppColors.primary : AppColors.textMuted,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    stockStore.removeListener(_onStoreUpdated);
    _stockSearchController.dispose();
    _historySearchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // 1. TOP HEADER WITH DYNAMIC TITLE & "+ Entry" BUTTON
            Padding(
              padding: const EdgeInsets.only(left: 20, right: 16, top: 16, bottom: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            _activeMasterTab == "stock" ? "Stock " : "Production ",
                            style: GoogleFonts.outfit(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            _activeMasterTab == "stock" ? "Inventory" : "History",
                            style: GoogleFonts.outfit(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                          if (stockStore.isSyncing) ...[
                            const SizedBox(width: 8),
                            const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ],
                      ),
                      Text(
                        _activeMasterTab == "stock"
                            ? "Manage inventory across Office & Thottam plants"
                            : "Historical manufacturing records & material logs",
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          color: AppColors.textMuted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),

                  // Top-Right "+ Entry" Button
                  GestureDetector(
                    onTap: _navigateToNewProductionEntry,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        gradient: AppColors.buttonGradient,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.32),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.add_rounded, color: Colors.white, size: 20),
                          const SizedBox(width: 5),
                          Text(
                            "Entry",
                            style: GoogleFonts.outfit(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // 2. PRIMARY MASTER TOGGLE: [ 📦 Stock Inventory ]  [ 📜 Production History ]
            // Placed ABOVE store filters as requested by user
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  _buildMasterToggleTab(
                    id: "stock",
                    label: "Stock Inventory",
                    icon: Icons.inventory_2_rounded,
                  ),
                  _buildMasterToggleTab(
                    id: "history",
                    label: "Production History",
                    icon: Icons.history_rounded,
                  ),
                ],
              ),
            ),

            // 3. CONDITIONAL BODY CONTENT BASED ON MASTER TAB
            Expanded(
              child: _activeMasterTab == "stock"
                  ? _buildStockInventoryView()
                  : _buildProductionHistoryView(),
            ),
          ],
        ),
      ),
    );
  }

  // Master Toggle Button (Stock Inventory vs Production History)
  Widget _buildMasterToggleTab({
    required String id,
    required String label,
    required IconData icon,
  }) {
    final isSelected = _activeMasterTab == id;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() => _activeMasterTab = id);
          if (id == "history") {
            _loadHistoryData();
          }
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 9),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: const Color(0xFF0F172A).withValues(alpha: 0.08),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 16,
                color: isSelected ? AppColors.primary : AppColors.textMuted,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 12.5,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? AppColors.primary : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // =========================================================================
  // VIEW A: STOCK INVENTORY (Existing live inventory list)
  // =========================================================================
  Widget _buildStockInventoryView() {
    final allCount = StockService.getFilteredItems(
      filter: "all",
      category: _selectedCategory,
    ).length;

    final officeCount = StockService.getFilteredItems(
      filter: "office",
      category: _selectedCategory,
    ).length;

    final thottamCount = StockService.getFilteredItems(
      filter: "thottam",
      category: _selectedCategory,
    ).length;

    return Column(
      children: [
        // Store Filter Buttons: All Stores | Office | Thottam
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              _buildStoreFilterTab(
                id: "all",
                label: "All Stores",
                count: allCount,
              ),
              _buildStoreFilterTab(
                id: "office",
                label: "Office",
                count: officeCount,
              ),
              _buildStoreFilterTab(
                id: "thottam",
                label: "Thottam",
                count: thottamCount,
              ),
            ],
          ),
        ),

        // Search Bar & Category Filter Button
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: TextField(
                    controller: _stockSearchController,
                    onChanged: (val) => setState(() => _stockSearchQuery = val),
                    style: GoogleFonts.outfit(fontSize: 13.5, color: AppColors.textPrimary),
                    decoration: InputDecoration(
                      isDense: true,
                      border: InputBorder.none,
                      hintText: "Search by ID or Product Name...",
                      hintStyle: GoogleFonts.outfit(fontSize: 12.5, color: AppColors.textMuted),
                      prefixIcon: const Icon(Icons.search_rounded, size: 18, color: AppColors.textMuted),
                      suffixIcon: _stockSearchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded, size: 16),
                              onPressed: () {
                                _stockSearchController.clear();
                                setState(() => _stockSearchQuery = "");
                              },
                            )
                          : null,
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              GestureDetector(
                onTap: _showCategoryFilterBottomSheet,
                child: Container(
                  height: 44,
                  padding: const EdgeInsets.symmetric(horizontal: 13),
                  decoration: BoxDecoration(
                    color: _selectedCategory != "all" ? AppColors.primary : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _selectedCategory != "all" ? AppColors.primary : AppColors.border,
                      width: 1.2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: _selectedCategory != "all"
                            ? AppColors.primary.withValues(alpha: 0.28)
                            : const Color(0xFF0F172A).withValues(alpha: 0.03),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.tune_rounded,
                        size: 18,
                        color: _selectedCategory != "all" ? Colors.white : AppColors.primary,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _selectedCategory == "all" ? "Filter" : _getCategoryLabel(_selectedCategory),
                        style: GoogleFonts.outfit(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: _selectedCategory != "all" ? Colors.white : AppColors.textPrimary,
                        ),
                      ),
                      if (_selectedCategory != "all") ...[
                        const SizedBox(width: 6),
                        GestureDetector(
                          onTap: () {
                            setState(() => _selectedCategory = "all");
                          },
                          child: const Icon(Icons.close_rounded, size: 14, color: Colors.white),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 4),

        // Live Stock List from Backend
        Expanded(
          child: _isLoading
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primary),
                      SizedBox(height: 12),
                      Text(
                        "Bridging live inventory from backend...",
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadAllData,
                  color: AppColors.primary,
                  child: _filteredStockItems.isEmpty
                      ? ListView(
                          children: [
                            SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                            Center(
                              child: Column(
                                children: [
                                  Icon(
                                    Icons.inventory_2_outlined,
                                    size: 48,
                                    color: AppColors.textMuted.withValues(alpha: 0.5),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    "No ${_selectedCategory != 'all' ? _getCategoryLabel(_selectedCategory) : 'stock'} items found",
                                    style: GoogleFonts.outfit(
                                      fontSize: 14,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    "Pull down to refresh or change filters",
                                    style: GoogleFonts.outfit(
                                      fontSize: 12,
                                      color: AppColors.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        )
                      : ListView.builder(
                          physics: const AlwaysScrollableScrollPhysics(
                            parent: BouncingScrollPhysics(),
                          ),
                          padding: const EdgeInsets.only(left: 20, right: 20, top: 4, bottom: 24),
                          itemCount: _filteredStockItems.length,
                          itemBuilder: (context, index) {
                            final item = _filteredStockItems[index];
                            return _buildProductCard(item);
                          },
                        ),
                ),
        ),
      ],
    );
  }

  Widget _buildStoreFilterTab({
    required String id,
    required String label,
    required int count,
  }) {
    final isSelected = _selectedStoreFilter == id;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedStoreFilter = id),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 9),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.25),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 12.5,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? Colors.white : AppColors.textSecondary,
                ),
              ),
              const SizedBox(width: 5),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(
                  color: isSelected ? Colors.white.withValues(alpha: 0.25) : AppColors.backgroundSecondary,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  "$count",
                  style: GoogleFonts.outfit(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isSelected ? Colors.white : AppColors.textMuted,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProductCard(StockItem item) {
    Color pillBg;
    Color pillBorder;
    Color pillText;

    if (item.isOutOfStock) {
      pillBg = const Color(0xFFFEE2E2);
      pillBorder = const Color(0xFFFECACA);
      pillText = const Color(0xFFB91C1C);
    } else if (item.isLowStock) {
      pillBg = const Color(0xFFFEF3C7);
      pillBorder = const Color(0xFFFDE68A);
      pillText = const Color(0xFFB45309);
    } else {
      pillBg = const Color(0xFFD1FAE5);
      pillBorder = const Color(0xFFA7F3D0);
      pillText = const Color(0xFF047857);
    }

    final isOffice = item.officeName.toLowerCase().contains("office");

    return Container(
      margin: const EdgeInsets.only(bottom: 11),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 1.1),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.025),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Row 1: Product Icon, Name, Category & Status Pill
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: isOffice ? AppColors.primarySoft : const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isOffice ? AppColors.primaryBorder : const Color(0xFFFED7AA),
                    width: 0.8,
                  ),
                ),
                child: Icon(
                  item.category.contains("cement")
                      ? Icons.all_inbox_rounded
                      : (item.category.contains("sand") || item.category.contains("stone") || item.category.contains("raw"))
                          ? Icons.landscape_rounded
                          : Icons.view_in_ar_rounded,
                  color: isOffice ? AppColors.primary : AppColors.brickAmber,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.productName.toUpperCase(),
                      style: GoogleFonts.outfit(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF0F172A),
                        letterSpacing: -0.2,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.category,
                      style: GoogleFonts.outfit(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                decoration: BoxDecoration(
                  color: pillBg,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: pillBorder),
                ),
                child: Text(
                  item.statusText,
                  style: GoogleFonts.outfit(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: pillText,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Divider(height: 1, thickness: 0.7, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 9),

          // Row 2: Location (Office / Thottam) & Product ID (PROD-XX)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.storefront_rounded,
                    size: 15,
                    color: isOffice ? AppColors.primary : AppColors.brickAmber,
                  ),
                  const SizedBox(width: 5),
                  Text(
                    item.officeName.toUpperCase(),
                    style: GoogleFonts.outfit(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF475569),
                      letterSpacing: 0.4,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Text(
                  "PROD-${item.productId}",
                  style: GoogleFonts.robotoMono(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 200.ms);
  }

  // =========================================================================
  // VIEW B: PRODUCTION HISTORY (Replicating website aswath.online/inventory/history)
  // =========================================================================
  Widget _buildProductionHistoryView() {
    return Column(
      children: [
        // 1. Plant Yard Filter: All Plants | Office | Thottam
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              _buildHistoryOfficeTab(id: "all", label: "All Plants"),
              _buildHistoryOfficeTab(id: "office", label: "Office"),
              _buildHistoryOfficeTab(id: "thottam", label: "Thottam"),
            ],
          ),
        ),

        // 2. Time Range Filter Pills: All Time | Today | This Week | This Month
        Container(
          height: 38,
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
          child: ListView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            children: [
              _buildTimeRangePill(id: "all", label: "All Time"),
              _buildTimeRangePill(id: "today", label: "Today"),
              _buildTimeRangePill(id: "week", label: "This Week"),
              _buildTimeRangePill(id: "month", label: "This Month"),
            ],
          ),
        ),

        // 3. Search Bar for Production History
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
          child: Container(
            height: 42,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: TextField(
              controller: _historySearchController,
              onChanged: (val) => setState(() => _historySearchQuery = val),
              style: GoogleFonts.outfit(fontSize: 13, color: AppColors.textPrimary),
              decoration: InputDecoration(
                isDense: true,
                border: InputBorder.none,
                hintText: "Search brick, plant, staff, or date...",
                hintStyle: GoogleFonts.outfit(fontSize: 12, color: AppColors.textMuted),
                prefixIcon: const Icon(Icons.search_rounded, size: 18, color: AppColors.textMuted),
                suffixIcon: _historySearchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, size: 16),
                        onPressed: () {
                          _historySearchController.clear();
                          setState(() => _historySearchQuery = "");
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(vertical: 11),
              ),
            ),
          ),
        ),

        // 4. Records count indicator
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 2),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "HISTORICAL MANUFACTURING LOGS",
                style: GoogleFonts.outfit(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                  color: AppColors.textMuted,
                ),
              ),
              Text(
                "${_filteredHistoryItems.length} records",
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 4),

        // 5. Production History List
        Expanded(
          child: _isHistoryLoading
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primary),
                      SizedBox(height: 12),
                      Text(
                        "Loading production logs from backend...",
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadHistoryData,
                  color: AppColors.primary,
                  child: _filteredHistoryItems.isEmpty
                      ? _buildEmptyHistoryState()
                      : ListView.builder(
                          physics: const AlwaysScrollableScrollPhysics(
                            parent: BouncingScrollPhysics(),
                          ),
                          padding: const EdgeInsets.only(left: 20, right: 20, top: 4, bottom: 24),
                          itemCount: _filteredHistoryItems.length,
                          itemBuilder: (context, index) {
                            final log = _filteredHistoryItems[index];
                            return _buildProductionHistoryCard(log);
                          },
                        ),
                ),
        ),
      ],
    );
  }

  Widget _buildHistoryOfficeTab({required String id, required String label}) {
    final isSelected = _historyOfficeFilter == id;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _historyOfficeFilter = id),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.25),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Center(
            child: Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? Colors.white : AppColors.textSecondary,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTimeRangePill({required String id, required String label}) {
    final isSelected = _historyTimeRange == id;
    return GestureDetector(
      onTap: () => setState(() => _historyTimeRange = id),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.25),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Center(
          child: Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
              color: isSelected ? Colors.white : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  // Empty state matching website (Layers icon + title + subtitle + Log Production Entry button)
  Widget _buildEmptyHistoryState() {
    return ListView(
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.12),
        Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEEF2FF),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE0E7FF)),
                  ),
                  child: const Icon(
                    Icons.layers_rounded,
                    color: AppColors.primary,
                    size: 32,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  "No production logs found",
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _historySearchQuery.isNotEmpty || _historyOfficeFilter != "all" || _historyTimeRange != "all"
                      ? "No manufacturing entries match your current search and filter criteria."
                      : "Start recording daily brick manufacturing logs to track finished output and cement consumption.",
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 12.5,
                    color: AppColors.textMuted,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 20),
                GestureDetector(
                  onTap: _navigateToNewProductionEntry,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 11),
                    decoration: BoxDecoration(
                      gradient: AppColors.buttonGradient,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.add_rounded, color: Colors.white, size: 18),
                        const SizedBox(width: 6),
                        Text(
                          "Log Production Entry",
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // Production History Log Card (Matching website table row information)
  Widget _buildProductionHistoryCard(ProductionLogItem log) {
    final isOffice = log.officeName.toLowerCase().contains("office");

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border, width: 1.1),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Date & #PROD-ID on left, Plant location badge on right
          Padding(
            padding: const EdgeInsets.only(left: 14, right: 14, top: 12, bottom: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.calendar_today_rounded, size: 13, color: AppColors.primary),
                    const SizedBox(width: 5),
                    Text(
                      log.formattedDate,
                      style: GoogleFonts.outfit(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        "#PROD-${log.id}",
                        style: GoogleFonts.robotoMono(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ],
                ),

                // Plant Location Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                  decoration: BoxDecoration(
                    color: isOffice ? const Color(0xFFEEF2FF) : const Color(0xFFFFF7ED),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isOffice ? const Color(0xFFE0E7FF) : const Color(0xFFFED7AA),
                      width: 0.8,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.storefront_rounded,
                        size: 13,
                        color: isOffice ? AppColors.primary : AppColors.brickAmber,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        log.officeName,
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isOffice ? AppColors.primary : AppColors.brickAmber,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 1, thickness: 0.7, color: Color(0xFFF1F5F9)),

          // Body: Product Info & Volume Badge
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Brick Icon
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF2FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE0E7FF)),
                      ),
                      child: const Icon(
                        Icons.view_in_ar_rounded,
                        color: AppColors.primary,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Brick Name & Stocks info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            log.productName.toUpperCase(),
                            style: GoogleFonts.outfit(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                              letterSpacing: -0.2,
                            ),
                          ),
                          const SizedBox(height: 2),
                          if (log.numberOfStocks > 0)
                            Text(
                              "${log.numberOfStocks} Stocks • ${log.bricksPerStock.toStringAsFixed(0)} per stock",
                              style: GoogleFonts.outfit(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                        ],
                      ),
                    ),

                    // Volume Produced Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF2FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFC7D2FE)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            log.unitProduced.toInt().toString(),
                            style: GoogleFonts.outfit(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            "BRICKS",
                            style: GoogleFonts.outfit(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Material & Labor Row
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Cement Consumed
                      Row(
                        children: [
                          const Icon(Icons.all_inbox_rounded, size: 15, color: Color(0xFFD97706)),
                          const SizedBox(width: 5),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "${log.cementUsed.toStringAsFixed(1)} Bags",
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              Text(
                                log.cementProductName.split(' ').first,
                                style: GoogleFonts.outfit(
                                  fontSize: 10,
                                  color: AppColors.textMuted,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),

                      // Wage Rate
                      Row(
                        children: [
                          const Icon(Icons.payments_rounded, size: 15, color: Color(0xFF059669)),
                          const SizedBox(width: 5),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "₹${log.totalWage.toStringAsFixed(0)}",
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF059669),
                                ),
                              ),
                              Text(
                                "₹${log.pricePerStock.toStringAsFixed(0)}/stock",
                                style: GoogleFonts.outfit(
                                  fontSize: 10,
                                  color: AppColors.textMuted,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),

                      // Staff Count
                      Row(
                        children: [
                          const Icon(Icons.group_rounded, size: 15, color: Color(0xFF475569)),
                          const SizedBox(width: 5),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "${log.employeeNames.length} Staff",
                                style: GoogleFonts.outfit(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              Text(
                                log.employeeNames.isNotEmpty
                                    ? log.employeeNames.first.split(' ').first
                                    : "None",
                                style: GoogleFonts.outfit(
                                  fontSize: 10,
                                  color: AppColors.textMuted,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Staff Chips (if present)
                if (log.employeeNames.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: log.employeeNames.map((name) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.person_rounded, size: 11, color: Color(0xFF64748B)),
                            const SizedBox(width: 3),
                            Text(
                              name,
                              style: GoogleFonts.outfit(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF475569),
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),

          const Divider(height: 1, thickness: 0.7, color: Color(0xFFF1F5F9)),

          // Bottom Action Buttons: [ 👁️ View Details ]   [ 🗑️ Delete ]
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // View Details Button
                GestureDetector(
                  onTap: () => _showProductionDetailBottomSheet(log),
                  child: Row(
                    children: [
                      const Icon(Icons.visibility_outlined, size: 16, color: AppColors.primary),
                      const SizedBox(width: 5),
                      Text(
                        "View Details",
                        style: GoogleFonts.outfit(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),

                // Delete Button (Reverses stock, restores cement & raw materials, reverts wages)
                GestureDetector(
                  onTap: () => _confirmDeleteProductionLog(log),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFFECACA)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.delete_outline_rounded, size: 14, color: Color(0xFFDC2626)),
                        const SizedBox(width: 4),
                        Text(
                          "Delete",
                          style: GoogleFonts.outfit(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFFDC2626),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 200.ms);
  }

  // Confirmation dialog for deleting production log
  void _confirmDeleteProductionLog(ProductionLogItem log) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626), size: 22),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  "Delete #PROD-${log.id}?",
                  style: GoogleFonts.outfit(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0F172A),
                  ),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Deleting this manufacturing log will automatically:",
                style: GoogleFonts.outfit(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 10),
              _buildDeleteNoticeItem("Deduct ${log.unitProduced.toInt()} units of ${log.productName} from stock"),
              _buildDeleteNoticeItem("Restore ${log.cementUsed.toStringAsFixed(1)} bags of cement to inventory"),
              _buildDeleteNoticeItem("Reverse staff wages for assigned team members"),
              const SizedBox(height: 12),
              Text(
                "Are you sure you want to proceed?",
                style: GoogleFonts.outfit(fontSize: 12.5, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                "Keep Log",
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textMuted,
                ),
              ),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              onPressed: () async {
                final messenger = ScaffoldMessenger.of(context);
                Navigator.pop(context);
                final success = await StockService.deleteProductionLog(log.id);
                if (!mounted) return;
                if (success) {
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text("Production log #PROD-${log.id} deleted and stock reversed!"),
                      backgroundColor: const Color(0xFF059669),
                    ),
                  );
                  setState(() {});
                } else {
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text("Failed to delete production log"),
                      backgroundColor: Color(0xFFDC2626),
                    ),
                  );
                }
              },
              child: Text(
                "Delete & Revert Stock",
                style: GoogleFonts.outfit(fontSize: 12.5, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDeleteNoticeItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("• ", style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.bold)),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.outfit(fontSize: 12, color: const Color(0xFF475569)),
            ),
          ),
        ],
      ),
    );
  }

  // Full Detail Modal (Volume, Cement, Wages split, and BOM Snapshot table)
  void _showProductionDetailBottomSheet(ProductionLogItem log) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Top drag bar
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Production Details",
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          "#PROD-${log.id} • ${log.formattedDate}",
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),

              const Divider(height: 1, color: Color(0xFFF1F5F9)),

              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    // Overview Metric Cards
                    Row(
                      children: [
                        _buildDetailMetricCard(
                          title: "OUTPUT BATCH",
                          value: "${log.unitProduced.toInt()}",
                          unit: "BRICKS",
                          subtitle: "${log.numberOfStocks} Stocks • ${log.bricksPerStock.toStringAsFixed(0)}/stk",
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 10),
                        _buildDetailMetricCard(
                          title: "CEMENT USED",
                          value: log.cementUsed.toStringAsFixed(1),
                          unit: "BAGS",
                          subtitle: log.cementProductName,
                          color: const Color(0xFFD97706),
                        ),
                      ],
                    ),

                    const SizedBox(height: 10),

                    Row(
                      children: [
                        _buildDetailMetricCard(
                          title: "TOTAL BATCH WAGE",
                          value: "₹${log.totalWage.toStringAsFixed(0)}",
                          unit: "",
                          subtitle: "₹${log.pricePerStock.toStringAsFixed(0)} / stock",
                          color: const Color(0xFF059669),
                        ),
                        const SizedBox(width: 10),
                        _buildDetailMetricCard(
                          title: "MANUFACTURING YARD",
                          value: log.officeName,
                          unit: "",
                          subtitle: "Plant verified",
                          color: const Color(0xFF475569),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // Operators & Wage Split
                    Text(
                      "ASSIGNED OPERATORS & WAGE SPLIT (${log.employeeNames.length})",
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                        color: AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 8),

                    if (log.employeeNames.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Text(
                          "No operators were linked to this batch.",
                          style: GoogleFonts.outfit(fontSize: 12, color: AppColors.textMuted),
                        ),
                      )
                    else
                      ...log.employeeNames.map((name) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    width: 30,
                                    height: 30,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEEF2FF),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Icon(Icons.person_rounded, size: 16, color: AppColors.primary),
                                  ),
                                  const SizedBox(width: 10),
                                  Text(
                                    name,
                                    style: GoogleFonts.outfit(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                ],
                              ),
                              Text(
                                "₹${log.wagePerPerson.toStringAsFixed(2)}",
                                style: GoogleFonts.outfit(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF059669),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),

                    const SizedBox(height: 20),

                    // BOM Raw Materials Snapshot (if available)
                    Text(
                      "PHYSICAL STOCK DEDUCTIONS (PLANT BOM SNAPSHOT)",
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                        color: AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 8),

                    if (log.rawMaterialsUsed.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Text(
                          "No custom BOM ratio was recorded for this entry.",
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            color: AppColors.textMuted,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      )
                    else
                      Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          children: [
                            // Header row
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: const BoxDecoration(
                                color: Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.vertical(top: Radius.circular(13)),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    flex: 3,
                                    child: Text(
                                      "MATERIAL",
                                      style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFF64748B)),
                                    ),
                                  ),
                                  Expanded(
                                    flex: 2,
                                    child: Text(
                                      "ACTUAL",
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFF64748B)),
                                    ),
                                  ),
                                  Expanded(
                                    flex: 2,
                                    child: Text(
                                      "STANDARD",
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFF64748B)),
                                    ),
                                  ),
                                  Expanded(
                                    flex: 2,
                                    child: Text(
                                      "STATUS",
                                      textAlign: TextAlign.right,
                                      style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFF64748B)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // Data rows
                            ...log.rawMaterialsUsed.map((mat) {
                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                                decoration: const BoxDecoration(
                                  border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      flex: 3,
                                      child: Text(
                                        mat.materialName,
                                        style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF0F172A)),
                                      ),
                                    ),
                                    Expanded(
                                      flex: 2,
                                      child: Text(
                                        "${mat.actualQty} ${mat.unit}",
                                        textAlign: TextAlign.center,
                                        style: GoogleFonts.outfit(fontSize: 11.5, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A)),
                                      ),
                                    ),
                                    Expanded(
                                      flex: 2,
                                      child: Text(
                                        "${mat.standardQty} ${mat.unit}",
                                        textAlign: TextAlign.center,
                                        style: GoogleFonts.outfit(fontSize: 11, color: const Color(0xFF64748B)),
                                      ),
                                    ),
                                    Expanded(
                                      flex: 2,
                                      child: Text(
                                        mat.varianceStatus,
                                        textAlign: TextAlign.right,
                                        style: GoogleFonts.outfit(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w800,
                                          color: mat.varianceStatus == "OPTIMAL"
                                              ? const Color(0xFF059669)
                                              : (mat.varianceStatus == "HIGH" ? const Color(0xFFD97706) : const Color(0xFF2563EB)),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                          ],
                        ),
                      ),
                  ],
                ),
              ),

              // Bottom Button
              Padding(
                padding: const EdgeInsets.all(20),
                child: SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: () => Navigator.pop(context),
                    child: Text(
                      "Done",
                      style: GoogleFonts.outfit(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailMetricCard({
    required String title,
    required String value,
    required String unit,
    required String subtitle,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: GoogleFonts.outfit(
                fontSize: 9.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: const Color(0xFF94A3B8),
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Text(
                  value,
                  style: GoogleFonts.outfit(
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                    color: color,
                  ),
                ),
                if (unit.isNotEmpty) ...[
                  const SizedBox(width: 4),
                  Text(
                    unit,
                    style: GoogleFonts.outfit(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.outfit(
                fontSize: 10.5,
                color: AppColors.textMuted,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

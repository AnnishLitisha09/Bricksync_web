import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/models/stock_item.dart';
import '../../core/services/stock_service.dart';
import '../../core/theme/app_colors.dart';

class NewProductionEntryPage extends StatefulWidget {
  final VoidCallback onSaved;

  const NewProductionEntryPage({super.key, required this.onSaved});

  @override
  State<NewProductionEntryPage> createState() => _NewProductionEntryPageState();
}

class _NewProductionEntryPageState extends State<NewProductionEntryPage> {
  // Date is prefilled with today's date
  DateTime _selectedDate = DateTime.now();

  // All other fields start blank
  String? _selectedOffice;
  StockItem? _selectedBrickProduct;
  StockItem? _selectedCementProduct;

  final TextEditingController _stocksController = TextEditingController();
  final TextEditingController _bricksPerStockController = TextEditingController();
  final TextEditingController _cementBagsController = TextEditingController();
  final TextEditingController _pricePerStockController = TextEditingController();

  List<String> _offices = [];
  List<String> _brickProducts = [];
  List<String> _availableStaff = [];
  final Set<String> _selectedStaff = {};

  bool _isLoadingBackendData = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadBackendData();
  }

  Future<void> _loadBackendData() async {
    setState(() => _isLoadingBackendData = true);

    // Fetch live plant offices, stock items, brick products, cement products, and staff list from backend
    final officesFuture = StockService.fetchOffices();
    final stockFuture = StockService.fetchStock();
    final brickProductsFuture = StockService.fetchBrickProducts();
    final cementProductsFuture = StockService.fetchCementProducts();
    final staffFuture = StockService.fetchEmployees();

    await Future.wait([officesFuture, stockFuture, brickProductsFuture, cementProductsFuture, staffFuture]);

    if (!mounted) return;

    setState(() {
      _offices = StockService.currentOffices;
      // Keep location blank until user selects
      _selectedOffice = null;

      _brickProducts = StockService.currentBrickProducts;

      // Keep products and inputs blank until user enters
      _selectedBrickProduct = null;
      _selectedCementProduct = null;

      _stocksController.clear();
      _bricksPerStockController.clear();
      _cementBagsController.clear();
      _pricePerStockController.clear();

      _availableStaff = StockService.currentStaff;

      _selectedStaff.clear();
      _isLoadingBackendData = false;
    });
  }

  int get _calculatedTotal {
    final stocks = int.tryParse(_stocksController.text.trim()) ?? 0;
    final bricks = int.tryParse(_bricksPerStockController.text.trim()) ?? 0;
    return stocks * bricks;
  }

  double get _totalBatchValuation {
    final stocks = int.tryParse(_stocksController.text.trim()) ?? 0;
    final price = double.tryParse(_pricePerStockController.text.trim()) ?? 0.0;
    return stocks * price;
  }

  @override
  void dispose() {
    _stocksController.dispose();
    _bricksPerStockController.dispose();
    _cementBagsController.dispose();
    _pricePerStockController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  String _formatDate(DateTime d) {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return "${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]} ${d.year}";
  }

  /// Opens bottom sheet picker showing ONLY brick products available at the chosen office
  void _showBrickProductPicker() {
    if (_selectedOffice == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please select a Plant Location (Office or Thottam) first"),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final officeBricks = StockService.getBrickProductsForOffice(_selectedOffice);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        String searchQuery = "";
        return StatefulBuilder(
          builder: (context, setModalState) {
            final filteredList = officeBricks.isNotEmpty
                ? officeBricks.where((b) {
                    final q = searchQuery.toLowerCase().trim();
                    return q.isEmpty ||
                        b.productName.toLowerCase().contains(q) ||
                        b.productId.toString().contains(q) ||
                        "prod-${b.productId}".toLowerCase().contains(q);
                  }).toList()
                : _brickProducts.where((p) {
                    final q = searchQuery.toLowerCase().trim();
                    return q.isEmpty || p.toLowerCase().contains(q);
                  }).map((name) => StockItem(
                    id: 0,
                    productId: 0,
                    productName: name,
                    category: "bricks",
                    officeName: _selectedOffice!,
                    officeId: 1,
                    quantity: 0,
                    formattedQuantity: "0.00",
                    unit: "NOS",
                  )).toList();

            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.75,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: const EdgeInsets.only(left: 20, right: 20, top: 12, bottom: 28),
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
                  const SizedBox(height: 14),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Manufactured Brick Product",
                            style: GoogleFonts.outfit(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            "Available at $_selectedOffice Plant",
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, size: 20, color: AppColors.textSecondary),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Search Bar
                  Container(
                    height: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: TextField(
                      autofocus: false,
                      onChanged: (val) {
                        setModalState(() => searchQuery = val);
                      },
                      style: GoogleFonts.outfit(fontSize: 13.5, color: AppColors.textPrimary),
                      decoration: InputDecoration(
                        isDense: true,
                        border: InputBorder.none,
                        hintText: "Search brick product by name or ID...",
                        hintStyle: GoogleFonts.outfit(fontSize: 12.5, color: AppColors.textMuted),
                        prefixIcon: const Icon(Icons.search_rounded, size: 18, color: AppColors.textMuted),
                        contentPadding: const EdgeInsets.symmetric(vertical: 11),
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  Flexible(
                    child: filteredList.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(28),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.view_in_ar_rounded, size: 36, color: AppColors.textMuted.withValues(alpha: 0.5)),
                                  const SizedBox(height: 8),
                                  Text(
                                    "No brick products found for '$_selectedOffice'",
                                    style: GoogleFonts.outfit(color: AppColors.textSecondary, fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.separated(
                            shrinkWrap: true,
                            itemCount: filteredList.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 8),
                            itemBuilder: (context, index) {
                              final item = filteredList[index];
                              final isSelected = _selectedBrickProduct?.productName == item.productName;

                              return GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _selectedBrickProduct = item;
                                    // Keep price and all other fields blank - no automatic price filling
                                  });
                                  Navigator.pop(context);
                                },
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 150),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: isSelected ? AppColors.primarySoft : Colors.white,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                      color: isSelected ? AppColors.primary : AppColors.border,
                                      width: isSelected ? 1.6 : 1.0,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 40,
                                        height: 40,
                                        decoration: BoxDecoration(
                                          color: isSelected ? Colors.white : const Color(0xFFFFF7ED),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: const Icon(
                                          Icons.view_in_ar_rounded,
                                          color: AppColors.brickAmber,
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
                                                fontSize: 14,
                                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w700,
                                                color: isSelected ? AppColors.primary : AppColors.textPrimary,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Row(
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFFF1F5F9),
                                                    borderRadius: BorderRadius.circular(4),
                                                  ),
                                                  child: Text(
                                                    item.productId > 0 ? "PROD-${item.productId}" : "BRICKS",
                                                    style: GoogleFonts.robotoMono(
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.bold,
                                                      color: const Color(0xFF64748B),
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                  "Current: ${item.formattedQuantity} ${item.unit}",
                                                  style: GoogleFonts.outfit(
                                                    fontSize: 11.5,
                                                    color: AppColors.textMuted,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      Icon(
                                        isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                                        color: isSelected ? AppColors.primary : AppColors.textMuted,
                                        size: 20,
                                      ),
                                    ],
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
        );
      },
    );
  }

  /// Opens bottom sheet picker showing CEMENT types available at the chosen office
  void _showCementProductPicker() {
    if (_selectedOffice == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Please select a Plant Location (Office or Thottam) first"),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final officeCements = StockService.getCementProductsForOffice(_selectedOffice);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        String searchQuery = "";
        return StatefulBuilder(
          builder: (context, setModalState) {
            final filteredList = officeCements.where((c) {
              final q = searchQuery.toLowerCase().trim();
              return q.isEmpty ||
                  c.productName.toLowerCase().contains(q) ||
                  c.productId.toString().contains(q) ||
                  "prod-${c.productId}".toLowerCase().contains(q);
            }).toList();

            return Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.75,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: const EdgeInsets.only(left: 20, right: 20, top: 12, bottom: 28),
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
                  const SizedBox(height: 14),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Select Cement Type",
                            style: GoogleFonts.outfit(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            "Available at $_selectedOffice Plant",
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, size: 20, color: AppColors.textSecondary),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Search Bar for Cement
                  Container(
                    height: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: TextField(
                      autofocus: false,
                      onChanged: (val) {
                        setModalState(() => searchQuery = val);
                      },
                      style: GoogleFonts.outfit(fontSize: 13.5, color: AppColors.textPrimary),
                      decoration: InputDecoration(
                        isDense: true,
                        border: InputBorder.none,
                        hintText: "Search cement type by name or ID...",
                        hintStyle: GoogleFonts.outfit(fontSize: 12.5, color: AppColors.textMuted),
                        prefixIcon: const Icon(Icons.search_rounded, size: 18, color: AppColors.textMuted),
                        contentPadding: const EdgeInsets.symmetric(vertical: 11),
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  Flexible(
                    child: filteredList.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(28),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.all_inbox_rounded, size: 36, color: AppColors.textMuted.withValues(alpha: 0.5)),
                                  const SizedBox(height: 8),
                                  Text(
                                    "No cement products found for '$_selectedOffice'",
                                    style: GoogleFonts.outfit(color: AppColors.textSecondary, fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.separated(
                            shrinkWrap: true,
                            itemCount: filteredList.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 8),
                            itemBuilder: (context, index) {
                              final item = filteredList[index];
                              final isSelected = _selectedCementProduct?.productId == item.productId;

                              return GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _selectedCementProduct = item;
                                  });
                                  Navigator.pop(context);
                                },
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 150),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: isSelected ? AppColors.primarySoft : Colors.white,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                      color: isSelected ? AppColors.primary : AppColors.border,
                                      width: isSelected ? 1.6 : 1.0,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 40,
                                        height: 40,
                                        decoration: BoxDecoration(
                                          color: isSelected ? Colors.white : const Color(0xFFF5F3FF),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: const Icon(
                                          Icons.all_inbox_rounded,
                                          color: Color(0xFF7C3AED),
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
                                                fontSize: 14,
                                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w700,
                                                color: isSelected ? AppColors.primary : AppColors.textPrimary,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Row(
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFFF1F5F9),
                                                    borderRadius: BorderRadius.circular(4),
                                                  ),
                                                  child: Text(
                                                    item.productId > 0 ? "PROD-${item.productId}" : "CEMENT",
                                                    style: GoogleFonts.robotoMono(
                                                      fontSize: 10,
                                                      fontWeight: FontWeight.bold,
                                                      color: const Color(0xFF64748B),
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                  "Available: ${item.formattedQuantity} Bags",
                                                  style: GoogleFonts.outfit(
                                                    fontSize: 11.5,
                                                    color: item.quantity > 0 ? const Color(0xFF047857) : AppColors.error,
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      Icon(
                                        isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                                        color: isSelected ? AppColors.primary : AppColors.textMuted,
                                        size: 20,
                                      ),
                                    ],
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
        );
      },
    );
  }

  Future<void> _submit() async {
    if (_selectedOffice == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select a plant location (Office or Thottam)")),
      );
      return;
    }

    if (_selectedBrickProduct == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select a manufactured brick product")),
      );
      return;
    }

    if (_selectedCementProduct == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select a cement type")),
      );
      return;
    }

    final stocks = int.tryParse(_stocksController.text.trim()) ?? 0;
    final bricks = int.tryParse(_bricksPerStockController.text.trim()) ?? 0;
    final cement = int.tryParse(_cementBagsController.text.trim()) ?? 0;
    final price = double.tryParse(_pricePerStockController.text.trim()) ?? 0.0;

    if (stocks <= 0 || bricks <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please enter number of stocks and bricks per stock")),
      );
      return;
    }

    if (cement <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please enter cement bags used")),
      );
      return;
    }

    if (_selectedCementProduct != null && cement > _selectedCementProduct!.quantity) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            "Insufficient cement stock! Available: ${_selectedCementProduct!.formattedQuantity} Bags",
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);

    final resolvedOfficeId = _selectedOffice!.toLowerCase().contains("thot") || _selectedOffice!.toLowerCase().contains("thoom") ? 2 : 1;

    final success = await StockService.addProductionEntry(
      officeName: _selectedOffice!,
      productName: _selectedBrickProduct!.productName,
      productId: _selectedBrickProduct!.productId,
      officeId: resolvedOfficeId,
      cementProductId: _selectedCementProduct!.productId,
      numberOfStocks: stocks,
      bricksPerStock: bricks,
      cementBags: cement,
      pricePerStock: price,
      date: _selectedDate.toIso8601String().split('T').first,
      selectedStaff: _selectedStaff.toList(),
    );

    if (!mounted) return;

    setState(() => _isSaving = false);
    widget.onSaved();
    Navigator.pop(context);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.textPrimary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        content: Row(
          children: [
            Icon(
              success ? Icons.check_circle_rounded : Icons.info_outline_rounded,
              color: success ? AppColors.success : AppColors.brickAmber,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                success
                    ? "Production batch successfully logged to backend!"
                    : "Note: Entry recorded locally.",
                style: GoogleFonts.outfit(fontSize: 13, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "New Production Entry",
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: TextButton.icon(
              onPressed: _isSaving ? null : _submit,
              icon: _isSaving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                    )
                  : const Icon(Icons.check_rounded, size: 18, color: AppColors.primary),
              label: Text(
                "Save",
                style: GoogleFonts.outfit(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
        ],
      ),
      body: _isLoadingBackendData
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primary),
                  SizedBox(height: 14),
                  Text(
                    "Loading live backend plant details...",
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. DATE PICKER (The only field filled with current date)
                  _buildSectionHeader("PRODUCTION DATE", Icons.calendar_today_rounded),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: _pickDate,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border, width: 1.2),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: AppColors.primarySoft,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.calendar_month_rounded, color: AppColors.primary, size: 20),
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _formatDate(_selectedDate),
                                    style: GoogleFonts.outfit(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  Text(
                                    "Tap to choose production date",
                                    style: GoogleFonts.outfit(
                                      fontSize: 11,
                                      color: AppColors.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const Icon(Icons.edit_calendar_rounded, size: 18, color: AppColors.primary),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // 2. PRODUCTION LOCATION SELECTOR (Office / Thottam)
                  _buildSectionHeader("PRODUCTION UNIT / LOCATION", Icons.factory_rounded),
                  const SizedBox(height: 8),
                  Row(
                    children: _offices.map((loc) {
                      final isSelected = _selectedOffice == loc;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedOffice = loc;
                              // Resets products when plant location changes (matching website!)
                              _selectedBrickProduct = null;
                              _selectedCementProduct = null;
                            });
                          },
                          child: Container(
                            margin: EdgeInsets.only(right: loc != _offices.last ? 10 : 0),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.primarySoft : Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isSelected ? AppColors.primary : AppColors.border,
                                width: isSelected ? 1.8 : 1.1,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  loc.toLowerCase().contains("office")
                                      ? Icons.storefront_rounded
                                      : Icons.factory_rounded,
                                  size: 18,
                                  color: isSelected ? AppColors.primary : AppColors.textSecondary,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  loc,
                                  style: GoogleFonts.outfit(
                                    fontSize: 14,
                                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                    color: isSelected ? AppColors.primary : AppColors.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 20),

                  // 3. MANUFACTURED PRODUCT SELECTOR (Bricks only, plant-specific)
                  _buildSectionHeader("MANUFACTURED PRODUCT (BRICKS ONLY)", Icons.view_in_ar_rounded),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: _showBrickProductPicker,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: _selectedOffice != null ? Colors.white : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: _selectedBrickProduct != null ? AppColors.primary : AppColors.border,
                          width: _selectedBrickProduct != null ? 1.5 : 1.2,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.view_in_ar_rounded,
                            size: 20,
                            color: _selectedBrickProduct != null
                                ? AppColors.brickAmber
                                : _selectedOffice != null
                                    ? AppColors.textSecondary
                                    : AppColors.textMuted,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _selectedBrickProduct != null
                                  ? "${_selectedBrickProduct!.productName.toUpperCase()} (${_selectedBrickProduct!.formattedQuantity} Nos in Stock)"
                                  : _selectedOffice != null
                                      ? "Choose Brick Product ($_selectedOffice)"
                                      : "Select Plant Location First",
                              style: GoogleFonts.outfit(
                                fontSize: 14,
                                fontWeight: _selectedBrickProduct != null ? FontWeight.w700 : FontWeight.w500,
                                color: _selectedBrickProduct != null
                                    ? AppColors.textPrimary
                                    : _selectedOffice != null
                                        ? AppColors.textSecondary
                                        : AppColors.textMuted,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textSecondary),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // 4. CEMENT TYPE SELECTOR (Plant-specific cement products with stock)
                  _buildSectionHeader("CEMENT TYPE", Icons.all_inbox_rounded),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: _showCementProductPicker,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: _selectedOffice != null ? Colors.white : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: _selectedCementProduct != null ? const Color(0xFF7C3AED) : AppColors.border,
                          width: _selectedCementProduct != null ? 1.5 : 1.2,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.all_inbox_rounded,
                            size: 20,
                            color: _selectedCementProduct != null
                                ? const Color(0xFF7C3AED)
                                : _selectedOffice != null
                                    ? AppColors.textSecondary
                                    : AppColors.textMuted,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _selectedCementProduct != null
                                  ? "${_selectedCementProduct!.productName.toUpperCase()} (${_selectedCementProduct!.formattedQuantity} Bags in Stock)"
                                  : _selectedOffice != null
                                      ? "Choose Cement Type ($_selectedOffice)"
                                      : "Select Plant Location First",
                              style: GoogleFonts.outfit(
                                fontSize: 14,
                                fontWeight: _selectedCementProduct != null ? FontWeight.w700 : FontWeight.w500,
                                color: _selectedCementProduct != null
                                    ? AppColors.textPrimary
                                    : _selectedOffice != null
                                        ? AppColors.textSecondary
                                        : AppColors.textMuted,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textSecondary),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // 5. STOCKS & BRICKS PER STOCK (Blank fields)
                  _buildSectionHeader("OUTPUT SPECIFICATIONS", Icons.calculate_outlined),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _buildInputField(
                          label: "NO. OF STOCKS",
                          controller: _stocksController,
                          hint: "0",
                          icon: Icons.layers_outlined,
                          onChanged: (_) => setState(() {}),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildInputField(
                          label: "BRICKS / STOCK",
                          controller: _bricksPerStockController,
                          hint: "0",
                          icon: Icons.grid_3x3_rounded,
                          onChanged: (_) => setState(() {}),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Live Calculated Total Card (Starts at 0 until user fills data)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.primarySoft,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.primaryBorder),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "TOTAL BATCH PRODUCTION",
                              style: GoogleFonts.outfit(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.8,
                                color: AppColors.primary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              "$_calculatedTotal Pcs",
                              style: GoogleFonts.outfit(
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              "ESTIMATED VALUATION",
                              style: GoogleFonts.outfit(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.8,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              "₹ ${_totalBatchValuation.toStringAsFixed(0)}",
                              style: GoogleFonts.outfit(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // 6. CEMENT USED & PRICE PER STOCK (Blank fields)
                  _buildSectionHeader("MATERIAL & COST", Icons.inventory_2_outlined),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _buildInputField(
                          label: "CEMENT USED (BAGS)",
                          controller: _cementBagsController,
                          hint: "0",
                          icon: Icons.all_inbox_rounded,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildInputField(
                          label: "PRICE / STOCK (₹)",
                          controller: _pricePerStockController,
                          hint: "0.00",
                          icon: Icons.currency_rupee_rounded,
                          onChanged: (_) => setState(() {}),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // 7. STAFF / LABOUR SHOWN AS CHIPS (None selected by default)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildSectionHeader("STAFF & LABOUR TEAM", Icons.people_outline_rounded),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: _selectedStaff.isEmpty ? const Color(0xFFF1F5F9) : AppColors.primarySoft,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          "${_selectedStaff.length} Selected",
                          style: GoogleFonts.outfit(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: _selectedStaff.isEmpty ? AppColors.textMuted : AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Interactive Staff Chips loaded from backend
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _availableStaff.map((staffName) {
                      final isSelected = _selectedStaff.contains(staffName);
                      return FilterChip(
                        label: Text(
                          staffName,
                          style: GoogleFonts.outfit(
                            fontSize: 12.5,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                            color: isSelected ? AppColors.primary : AppColors.textPrimary,
                          ),
                        ),
                        selected: isSelected,
                        onSelected: (bool selected) {
                          setState(() {
                            if (selected) {
                              _selectedStaff.add(staffName);
                            } else {
                              _selectedStaff.remove(staffName);
                            }
                          });
                        },
                        selectedColor: AppColors.primarySoft,
                        backgroundColor: Colors.white,
                        checkmarkColor: AppColors.primary,
                        side: BorderSide(
                          color: isSelected ? AppColors.primary : AppColors.border,
                          width: isSelected ? 1.4 : 1.0,
                        ),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 32),

                  // 8. RECORD BUTTON
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _isSaving ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: _isSaving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.save_rounded, size: 20),
                                const SizedBox(width: 10),
                                Text(
                                  "Record Production Batch",
                                  style: GoogleFonts.outfit(
                                    fontSize: 15.5,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),

                  const SizedBox(height: 28),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 15, color: AppColors.primary),
        const SizedBox(width: 6),
        Text(
          title,
          style: GoogleFonts.outfit(
            fontSize: 11.5,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.8,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildInputField({
    required String label,
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    ValueChanged<String>? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 10.5,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.6,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          height: 48,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border, width: 1.1),
          ),
          child: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            onChanged: onChanged,
            style: GoogleFonts.outfit(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
            decoration: InputDecoration(
              isDense: true,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
              hintText: hint,
              hintStyle: GoogleFonts.outfit(color: AppColors.textMuted, fontSize: 13),
              prefixIcon: Icon(icon, size: 18, color: AppColors.textMuted),
            ),
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/fleet_service.dart';
import '../../core/theme/app_colors.dart';

class FuelRecordsPage extends StatefulWidget {
  final int? initialVehicleId;

  const FuelRecordsPage({
    super.key,
    this.initialVehicleId,
  });

  @override
  State<FuelRecordsPage> createState() => _FuelRecordsPageState();
}

class _FuelRecordsPageState extends State<FuelRecordsPage> {
  List<FuelRecordModel> _fuels = [];
  bool _isLoading = true;
  String _searchQuery = "";
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadFuels();
    if (widget.initialVehicleId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _openAddFuelModal(preselectedVehicleId: widget.initialVehicleId);
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadFuels() async {
    setState(() => _isLoading = true);
    final records = await FleetService.fetchFuelRecords(search: _searchQuery);
    if (mounted) {
      setState(() {
        _fuels = records;
        _isLoading = false;
      });
    }
  }

  List<FuelRecordModel> get _filteredFuels {
    if (_searchQuery.trim().isEmpty) return _fuels;
    final q = _searchQuery.toLowerCase().trim();
    return _fuels.where((f) {
      return f.vehicleNumber.toLowerCase().contains(q) ||
          f.vehicleName.toLowerCase().contains(q) ||
          f.bunkName.toLowerCase().contains(q);
    }).toList();
  }

  double get _totalVolume => _fuels.fold(0.0, (acc, f) => acc + f.volume);
  double get _totalExpense => _fuels.fold(0.0, (acc, f) => acc + f.amount);

  Future<void> _verifyFuel(int fuelId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          "Verify Fuel Record?",
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 17),
        ),
        content: Text(
          "Mark as verified to confirm this bunk fuel fill and expense statement.",
          style: GoogleFonts.outfit(fontSize: 13, color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text("Cancel", style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: AppColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text("Verify Now", style: GoogleFonts.outfit(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final res = await FleetService.verifyFuelRecord(fuelId);
      if (res.isSuccess) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("Fuel entry verified successfully!", style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
              backgroundColor: const Color(0xFF059669),
            ),
          );
          _loadFuels();
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res.error ?? "Failed to verify entry", style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
        }
      }
    }
  }

  Future<void> _deleteFuel(int fuelId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          "Delete Record?",
          style: GoogleFonts.outfit(fontWeight: FontWeight.w800, fontSize: 17, color: const Color(0xFFDC2626)),
        ),
        content: Text(
          "This action cannot be undone. The fuel entry will be removed permanently from fleet and bunk statements.",
          style: GoogleFonts.outfit(fontSize: 13, color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text("Go Back", style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: AppColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text("Delete Log", style: GoogleFonts.outfit(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final res = await FleetService.deleteFuelRecord(fuelId);
      if (res.isSuccess) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("Fuel log deleted", style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
              backgroundColor: const Color(0xFF0F172A),
            ),
          );
          _loadFuels();
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res.error ?? "Failed to delete log", style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
        }
      }
    }
  }

  void _openAddFuelModal({int? preselectedVehicleId}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AddFuelModal(
        preselectedVehicleId: preselectedVehicleId,
        onSuccess: () {
          _loadFuels();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredFuels;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
        title: RichText(
          text: TextSpan(
            style: GoogleFonts.outfit(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF0F172A),
            ),
            children: const [
              TextSpan(text: "Fuel "),
              TextSpan(
                text: "Records",
                style: TextStyle(color: Color(0xFF4F46E5)),
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            tooltip: "Refresh fuel logs",
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF64748B)),
            onPressed: _loadFuels,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadFuels,
              color: AppColors.primary,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                children: [
                  // Subtitle & "+ Add Fuel Record" header button
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          "Monitoring fleet fuel consumption, bunk entries & bill payments",
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF4F46E5),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        onPressed: () => _openAddFuelModal(),
                        icon: const Icon(Icons.add_rounded, size: 16),
                        label: Text(
                          "Add Fuel Record",
                          style: GoogleFonts.outfit(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Quick stats cards (TOTAL VOLUME, TOTAL EXPENSE)
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          title: "TOTAL VOLUME",
                          value: "${_totalVolume.toStringAsFixed(0)} L",
                          icon: Icons.water_drop_rounded,
                          iconBg: const Color(0xFFEEF2FF),
                          iconColor: const Color(0xFF4F46E5),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildStatCard(
                          title: "TOTAL EXPENSE",
                          value: "₹ ${_totalExpense.toStringAsFixed(0)}",
                          icon: Icons.credit_card_rounded,
                          iconBg: const Color(0xFFECFDF5),
                          iconColor: const Color(0xFF059669),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Search bar
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.02),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: TextField(
                      controller: _searchController,
                      onChanged: (val) => setState(() => _searchQuery = val),
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                      decoration: InputDecoration(
                        border: InputBorder.none,
                        hintText: "Search Vehicle Number or Bunk...",
                        hintStyle: GoogleFonts.outfit(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textMuted,
                        ),
                        icon: const Icon(Icons.search_rounded, color: AppColors.textMuted, size: 20),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.close_rounded, size: 18),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _searchQuery = "");
                                },
                              )
                            : null,
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Fuel records list
                  if (filtered.isEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
                      margin: const EdgeInsets.only(top: 10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        children: [
                          Icon(Icons.local_gas_station_outlined, size: 52, color: Colors.grey.shade400),
                          const SizedBox(height: 14),
                          Text(
                            "No Records Found",
                            style: GoogleFonts.outfit(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "No fuel consumption entries found. Tap 'Add Fuel Record' above to log a fill.",
                            textAlign: TextAlign.center,
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    ...filtered.map((f) => _buildFuelRecordCard(f)),

                  const SizedBox(height: 30),
                ],
              ),
            ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 20, color: iconColor),
              ),
              Text(
                title,
                style: GoogleFonts.outfit(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 19,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFuelRecordCard(FuelRecordModel f) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            // Top Row: Vehicle Number & Bunk Name + Volume Pill
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        f.vehicleNumber.isNotEmpty ? f.vehicleNumber : "TRUCK",
                        style: GoogleFonts.outfit(
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.local_gas_station_rounded, size: 13, color: AppColors.textMuted),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              f.bunkName.isNotEmpty ? f.bunkName : "Bunk Station",
                              style: GoogleFonts.outfit(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textMuted,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: Text(
                    "${f.volume.toStringAsFixed(1)} L",
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      fontStyle: FontStyle.italic,
                      color: const Color(0xFF1D4ED8),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),
            const Divider(height: 1, color: Color(0xFFF1F5F9)),
            const SizedBox(height: 10),

            // Middle Row: Amount, Date, Odometer
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "BILL AMOUNT",
                      style: GoogleFonts.outfit(
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                        color: AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "₹ ${f.amount.toStringAsFixed(0)}",
                      style: GoogleFonts.outfit(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "LOG DATE",
                      style: GoogleFonts.outfit(
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                        color: AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      f.formattedDate,
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "ODOMETER",
                      style: GoogleFonts.outfit(
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                        color: AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "${f.kilometer} KM",
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF4F46E5),
                      ),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Bottom Actions: Status Pill & Delete button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (f.isVerified)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFA7F3D0)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.check_circle_rounded, size: 12, color: Color(0xFF059669)),
                        const SizedBox(width: 4),
                        Text(
                          "VERIFIED",
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF047857),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  GestureDetector(
                    onTap: () => _verifyFuel(f.fuelId),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.pending_actions_rounded, size: 12, color: Color(0xFFD97706)),
                          const SizedBox(width: 4),
                          Text(
                            "VERIFY NOW",
                            style: GoogleFonts.outfit(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFFB45309),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                IconButton(
                  tooltip: "Delete record",
                  icon: const Icon(Icons.delete_outline_rounded, size: 18, color: Color(0xFF94A3B8)),
                  onPressed: () => _deleteFuel(f.fuelId),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AddFuelModal extends StatefulWidget {
  final int? preselectedVehicleId;
  final VoidCallback onSuccess;

  const _AddFuelModal({
    this.preselectedVehicleId,
    required this.onSuccess,
  });

  @override
  State<_AddFuelModal> createState() => _AddFuelModalState();
}

class _AddFuelModalState extends State<_AddFuelModal> {
  List<VehicleModel> _vehicles = [];
  List<BunkModel> _bunks = [];
  bool _loadingData = true;

  int? _selectedVehicleId;
  int? _selectedBunkId;
  DateTime _selectedDate = DateTime.now();
  final TextEditingController _volumeController = TextEditingController();
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _kmController = TextEditingController();
  bool _isSaving = false;
  String? _errorMsg;

  @override
  void initState() {
    super.initState();
    _selectedVehicleId = widget.preselectedVehicleId;
    _loadDependencies();
  }

  @override
  void dispose() {
    _volumeController.dispose();
    _amountController.dispose();
    _kmController.dispose();
    super.dispose();
  }

  Future<void> _loadDependencies() async {
    final vList = await FleetService.fetchVehicles();
    final bList = await FleetService.fetchBunks();
    if (mounted) {
      setState(() {
        _vehicles = vList;
        _bunks = bList;
        _loadingData = false;
        if (_selectedVehicleId == null && _vehicles.isNotEmpty) {
          _selectedVehicleId = _vehicles.first.id;
        }
        if (_selectedBunkId == null && _bunks.isNotEmpty) {
          _selectedBunkId = _bunks.first.id;
        }
      });
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 30)),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _submitFuel() async {
    if (_selectedVehicleId == null) {
      setState(() => _errorMsg = "Please select a vehicle");
      return;
    }
    if (_selectedBunkId == null) {
      setState(() => _errorMsg = "Please select a fuel bunk");
      return;
    }
    final volume = double.tryParse(_volumeController.text.trim()) ?? 0.0;
    if (volume <= 0) {
      setState(() => _errorMsg = "Please enter valid fuel volume in liters");
      return;
    }
    final amount = double.tryParse(_amountController.text.trim()) ?? 0.0;
    if (amount <= 0) {
      setState(() => _errorMsg = "Please enter valid bill amount (₹)");
      return;
    }

    setState(() {
      _isSaving = true;
      _errorMsg = null;
    });

    final dateStr = "${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}";
    final km = _kmController.text.trim();

    final res = await FleetService.createFuelRecord(
      vehicleId: _selectedVehicleId!,
      bunkId: _selectedBunkId!,
      volume: volume,
      amount: amount,
      date: dateStr,
      kilometer: km.isNotEmpty ? km : "0",
    );

    if (mounted) {
      setState(() => _isSaving = false);
      if (res.isSuccess) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Fuel record logged successfully!", style: GoogleFonts.outfit(fontWeight: FontWeight.w700)),
            backgroundColor: const Color(0xFF059669),
          ),
        );
        widget.onSuccess();
      } else {
        setState(() => _errorMsg = res.error ?? "Failed to save fuel log");
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(20, 12, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
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
                      "Add Fuel Record",
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      "Record bunk fueling, volume, bill amount & odometer",
                      style: GoogleFonts.outfit(fontSize: 12, color: AppColors.textMuted),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),

            if (_errorMsg != null)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, size: 16, color: Color(0xFFDC2626)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMsg!,
                        style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFFDC2626)),
                      ),
                    ),
                  ],
                ),
              ),

            if (_loadingData)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              )
            else ...[
              // Vehicle Dropdown
              Text(
                "SELECT VEHICLE *",
                style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<int>(
                    value: _selectedVehicleId,
                    isExpanded: true,
                    hint: Text("Choose vehicle...", style: GoogleFonts.outfit(fontSize: 13, color: AppColors.textMuted)),
                    items: _vehicles.map((v) {
                      return DropdownMenuItem<int>(
                        value: v.id,
                        child: Text(
                          "${v.number} • ${v.name}",
                          style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700),
                        ),
                      );
                    }).toList(),
                    onChanged: (val) => setState(() => _selectedVehicleId = val),
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // Bunk Dropdown
              Text(
                "SELECT FUEL BUNK *",
                style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<int>(
                    value: _selectedBunkId,
                    isExpanded: true,
                    hint: Text("Choose fuel bunk...", style: GoogleFonts.outfit(fontSize: 13, color: AppColors.textMuted)),
                    items: _bunks.map((b) {
                      return DropdownMenuItem<int>(
                        value: b.id,
                        child: Text(
                          b.bunkName,
                          style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700),
                        ),
                      );
                    }).toList(),
                    onChanged: (val) => setState(() => _selectedBunkId = val),
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // Volume & Amount row
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "VOLUME (LITERS) *",
                          style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _volumeController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700),
                          decoration: InputDecoration(
                            hintText: "e.g. 50",
                            suffixText: "L",
                            filled: true,
                            fillColor: const Color(0xFFF8FAFC),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "BILL AMOUNT (₹) *",
                          style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _amountController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700),
                          decoration: InputDecoration(
                            hintText: "e.g. 4500",
                            prefixText: "₹ ",
                            filled: true,
                            fillColor: const Color(0xFFF8FAFC),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Date Picker & Odometer Reading
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "LOG DATE",
                          style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted),
                        ),
                        const SizedBox(height: 6),
                        GestureDetector(
                          onTap: _pickDate,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 15),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.calendar_today_rounded, size: 16, color: AppColors.primary),
                                const SizedBox(width: 8),
                                Text(
                                  "${_selectedDate.day.toString().padLeft(2, '0')}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.year}",
                                  style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "ODOMETER (KM)",
                          style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textMuted),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _kmController,
                          keyboardType: TextInputType.number,
                          style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700),
                          decoration: InputDecoration(
                            hintText: "e.g. 1250",
                            suffixText: "KM",
                            filled: true,
                            fillColor: const Color(0xFFF8FAFC),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 22),

              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4F46E5),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  onPressed: _isSaving ? null : _submitFuel,
                  child: _isSaving
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)),
                        )
                      : Text(
                          "Save Fuel Record",
                          style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w800),
                        ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

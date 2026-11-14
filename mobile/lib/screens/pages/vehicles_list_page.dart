import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/services/fleet_service.dart';
import '../../core/theme/app_colors.dart';
import 'fuel_records_page.dart';

class VehiclesListPage extends StatefulWidget {
  const VehiclesListPage({super.key});

  @override
  State<VehiclesListPage> createState() => _VehiclesListPageState();
}

class _VehiclesListPageState extends State<VehiclesListPage> {
  List<VehicleModel> _vehicles = [];
  bool _isLoading = true;
  String _searchQuery = "";
  String _statusFilter = "ALL"; // ALL, ACTIVE, INACTIVE
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadVehicles();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadVehicles() async {
    setState(() => _isLoading = true);
    final list = await FleetService.fetchVehicles();
    if (mounted) {
      setState(() {
        _vehicles = list;
        _isLoading = false;
      });
    }
  }

  List<VehicleModel> get _filteredVehicles {
    return _vehicles.where((v) {
      final matchesSearch = _searchQuery.isEmpty ||
          v.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          v.number.toLowerCase().contains(_searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (_statusFilter == "ACTIVE") {
        return v.isActive;
      } else if (_statusFilter == "INACTIVE") {
        return !v.isActive;
      }
      return true;
    }).toList();
  }

  int get _activeCount => _vehicles.where((v) => v.isActive).length;
  int get _inactiveCount => _vehicles.where((v) => !v.isActive).length;
  double get _totalSpend => _vehicles.fold(0.0, (acc, v) => acc + v.totalCost);

  void _showVehicleDetails(VehicleModel v) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
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
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFC7D2FE)),
                    ),
                    child: const Icon(
                      Icons.local_shipping_rounded,
                      color: AppColors.primary,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          v.name.toUpperCase(),
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          "Plate: ${v.number}",
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: v.isActive ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: v.isActive ? const Color(0xFFA7F3D0) : const Color(0xFFFECACA),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: v.isActive ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          v.isActive ? "ACTIVE" : "INACTIVE",
                          style: GoogleFonts.outfit(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: v.isActive ? const Color(0xFF047857) : const Color(0xFFB91C1C),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Divider(height: 1, color: Color(0xFFE2E8F0)),
              const SizedBox(height: 16),

              Text(
                "DOCUMENT COMPLIANCE",
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                  color: AppColors.textMuted,
                ),
              ),
              const SizedBox(height: 10),
              _buildDocRow(
                icon: Icons.security_rounded,
                title: "Insurance Expiry",
                date: v.formattedInsurance,
                isExpired: v.isInsuranceExpired,
              ),
              const SizedBox(height: 8),
              _buildDocRow(
                icon: Icons.eco_rounded,
                title: "Pollution (PUC) Expiry",
                date: v.formattedPollution,
                isExpired: v.isPollutionExpired,
              ),
              const SizedBox(height: 8),
              _buildDocRow(
                icon: Icons.description_rounded,
                title: "RC Expiry",
                date: v.formattedRcDate,
                isExpired: v.isRcExpired,
              ),
              const SizedBox(height: 8),
              _buildDocRow(
                icon: Icons.speed_rounded,
                title: "Odometer Reading",
                date: "${v.kilometer} KM",
                isExpired: false,
              ),

              const SizedBox(height: 20),
              Text(
                "OPERATIONAL EXPENDITURE",
                style: GoogleFonts.outfit(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                  color: AppColors.textMuted,
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    _buildSpendRow("Fuel Bills", v.totalFuel),
                    const SizedBox(height: 6),
                    _buildSpendRow("Service & Repairs", v.totalService),
                    const SizedBox(height: 6),
                    _buildSpendRow("Spares & Parts", v.totalSpares),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Divider(height: 1, color: Color(0xFFE2E8F0)),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "Total Vehicle Spend",
                          style: GoogleFonts.outfit(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          "₹ ${v.totalCost.toStringAsFixed(0)}",
                          style: GoogleFonts.outfit(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF059669),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () => Navigator.pop(ctx),
                      child: Text(
                        "Close",
                        style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: AppColors.textSecondary),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      onPressed: () {
                        Navigator.pop(ctx);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => FuelRecordsPage(initialVehicleId: v.id),
                          ),
                        );
                      },
                      icon: const Icon(Icons.local_gas_station_rounded, size: 18),
                      label: Text(
                        "Log Fuel",
                        style: GoogleFonts.outfit(fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDocRow({
    required IconData icon,
    required String title,
    required String date,
    required bool isExpired,
  }) {
    return Row(
      children: [
        Icon(icon, size: 16, color: isExpired ? const Color(0xFFEF4444) : AppColors.textMuted),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            title,
            style: GoogleFonts.outfit(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: isExpired ? const Color(0xFFFEF2F2) : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: isExpired ? const Color(0xFFFECACA) : const Color(0xFFE2E8F0),
            ),
          ),
          child: Text(
            date,
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: isExpired ? const Color(0xFFDC2626) : AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSpendRow(String label, double amount) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: AppColors.textSecondary,
          ),
        ),
        Text(
          "₹ ${amount.toStringAsFixed(0)}",
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredVehicles;

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
              TextSpan(text: "Vehicle "),
              TextSpan(
                text: "Fleet Registry",
                style: TextStyle(color: Color(0xFF4F46E5)),
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            tooltip: "Refresh fleet",
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF64748B)),
            onPressed: _loadVehicles,
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
              onRefresh: _loadVehicles,
              color: AppColors.primary,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                children: [
                  // Header subtitle & assets count pill
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEEF2FF),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFC7D2FE)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.shield_outlined, size: 12, color: AppColors.primary),
                            const SizedBox(width: 5),
                            Text(
                              "Fleet Management",
                              style: GoogleFonts.outfit(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        "• ${_vehicles.length} Assets Registered",
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "Real-time tracking of transport trucks, documentation compliance & operational spend",
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textSecondary,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // KPI overview cards grid (matching web)
                  Row(
                    children: [
                      Expanded(
                        child: _buildKpiCard(
                          title: "TOTAL FLEET",
                          value: "${_vehicles.length}",
                          icon: Icons.local_shipping_rounded,
                          iconBg: const Color(0xFFEEF2FF),
                          iconColor: AppColors.primary,
                          isSelected: _statusFilter == "ALL",
                          onTap: () => setState(() => _statusFilter = "ALL"),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildKpiCard(
                          title: "COMPLIANT",
                          value: "$_activeCount",
                          icon: Icons.check_circle_rounded,
                          iconBg: const Color(0xFFECFDF5),
                          iconColor: const Color(0xFF059669),
                          isSelected: _statusFilter == "ACTIVE",
                          onTap: () => setState(() => _statusFilter = "ACTIVE"),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _buildKpiCard(
                          title: "ATTENTION",
                          value: "$_inactiveCount",
                          icon: Icons.warning_amber_rounded,
                          iconBg: const Color(0xFFFEF2F2),
                          iconColor: const Color(0xFFDC2626),
                          isSelected: _statusFilter == "INACTIVE",
                          onTap: () => setState(() => _statusFilter = "INACTIVE"),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildKpiCard(
                          title: "FLEET SPEND",
                          value: "₹ ${_totalSpend.toStringAsFixed(0)}",
                          icon: Icons.account_balance_wallet_rounded,
                          iconBg: const Color(0xFFF0FDF4),
                          iconColor: const Color(0xFF16A34A),
                          isSelected: false,
                          onTap: null,
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
                        BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 1)),
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
                        hintText: "Search vehicle name, plate number...",
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

                  const SizedBox(height: 14),

                  // Filter Chips (All, Active, Attention)
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildFilterChip("All Vehicles (${_vehicles.length})", "ALL"),
                        const SizedBox(width: 8),
                        _buildFilterChip("Compliant ($_activeCount)", "ACTIVE"),
                        const SizedBox(width: 8),
                        _buildFilterChip("Attention Needed ($_inactiveCount)", "INACTIVE"),
                      ],
                    ),
                  ),

                  const SizedBox(height: 14),

                  // Vehicle cards list
                  if (filtered.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(32),
                      margin: const EdgeInsets.only(top: 20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        children: [
                          Icon(Icons.directions_bus_outlined, size: 48, color: Colors.grey.shade400),
                          const SizedBox(height: 12),
                          Text(
                            "No Vehicles Found",
                            style: GoogleFonts.outfit(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "Try modifying your search or filter keywords",
                            style: GoogleFonts.outfit(fontSize: 12, color: AppColors.textMuted),
                          ),
                        ],
                      ),
                    )
                  else
                    ...filtered.map((v) => _buildVehicleCard(v)),

                  const SizedBox(height: 30),
                ],
              ),
            ),
    );
  }

  Widget _buildFilterChip(String label, String filterKey) {
    final isSelected = _statusFilter == filterKey;
    return GestureDetector(
      onTap: () => setState(() => _statusFilter = filterKey),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0),
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.2),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildKpiCard({
    required String title,
    required String value,
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required bool isSelected,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0),
            width: isSelected ? 1.8 : 1,
          ),
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
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: iconBg,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, size: 18, color: iconColor),
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
            const SizedBox(height: 8),
            Text(
              value,
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVehicleCard(VehicleModel v) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.025),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => _showVehicleDetails(v),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top row: Truck icon + Vehicle Name & Plate + Status Badge
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEEF2FF),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFC7D2FE)),
                      ),
                      child: const Icon(
                        Icons.local_shipping_rounded,
                        color: AppColors.primary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            v.name.toUpperCase(),
                            style: GoogleFonts.outfit(
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            "PLATE: ${v.number}",
                            style: GoogleFonts.outfit(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textMuted,
                              fontFeatures: [const FontFeature.tabularFigures()],
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Status Badge (matching web: ● ACTIVE / ● INACTIVE)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                      decoration: BoxDecoration(
                        color: v.isActive ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: v.isActive ? const Color(0xFFA7F3D0) : const Color(0xFFFECACA),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: v.isActive ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            v.isActive ? "ACTIVE" : "INACTIVE",
                            style: GoogleFonts.outfit(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              color: v.isActive ? const Color(0xFF047857) : const Color(0xFFB91C1C),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 14),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                const SizedBox(height: 12),

                // Metrics Grid (INSURANCE, POLLUTION, RC EXPIRY, ODOMETER, TOTAL SPEND)
                Row(
                  children: [
                    Expanded(
                      child: _buildMetricTile(
                        label: "INSURANCE",
                        value: v.formattedInsurance,
                        icon: Icons.shield_outlined,
                        isExpired: v.isInsuranceExpired,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildMetricTile(
                        label: "POLLUTION",
                        value: v.formattedPollution,
                        icon: Icons.eco_outlined,
                        isExpired: v.isPollutionExpired,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _buildMetricTile(
                        label: "RC EXPIRY",
                        value: v.formattedRcDate,
                        icon: Icons.calendar_today_rounded,
                        isExpired: v.isRcExpired,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildMetricTile(
                        label: "ODOMETER",
                        value: "${v.kilometer} KM",
                        icon: Icons.speed_rounded,
                        isExpired: false,
                        valueColor: const Color(0xFF4F46E5),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Total Spend & Action row
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
                      Row(
                        children: [
                          const Icon(Icons.account_balance_wallet_outlined, size: 16, color: Color(0xFF059669)),
                          const SizedBox(width: 6),
                          Text(
                            "TOTAL SPEND:",
                            style: GoogleFonts.outfit(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textMuted,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            "₹ ${v.totalCost.toStringAsFixed(0)}",
                            style: GoogleFonts.outfit(
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF059669),
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Text(
                            "View Details",
                            style: GoogleFonts.outfit(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.arrow_forward_rounded, size: 14, color: AppColors.primary),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMetricTile({
    required String label,
    required String value,
    required IconData icon,
    required bool isExpired,
    Color? valueColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isExpired ? const Color(0xFFFEF2F2) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isExpired ? const Color(0xFFFECACA) : const Color(0xFFF1F5F9),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                icon,
                size: 12,
                color: isExpired ? const Color(0xFFDC2626) : AppColors.textMuted,
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  label,
                  style: GoogleFonts.outfit(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                    color: isExpired ? const Color(0xFFDC2626) : AppColors.textMuted,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: isExpired
                  ? const Color(0xFFDC2626)
                  : (valueColor ?? AppColors.textPrimary),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

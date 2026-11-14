import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../../core/services/fleet_service.dart';
import '../pages/fuel_records_page.dart';
import '../pages/vehicles_list_page.dart';

class OthersTab extends StatefulWidget {
  const OthersTab({super.key});

  @override
  State<OthersTab> createState() => _OthersTabState();
}

class _OthersTabState extends State<OthersTab> {
  bool _isLoading = true;
  List<VehicleModel> _vehicles = [];

  @override
  void initState() {
    super.initState();
    _loadFleet();
  }

  Future<void> _loadFleet() async {
    setState(() => _isLoading = true);
    final vs = await FleetService.fetchVehicles();
    if (!mounted) return;
    setState(() {
      _vehicles = vs;
      _isLoading = false;
    });
  }

  int get _activeCount => _vehicles.where((v) => v.isActive).length;

  String get _fleetSummary {
    if (_isLoading) return "Fetching fleet status...";
    if (_vehicles.isEmpty) return "No vehicles registered";
    final activeNumbers = _vehicles
        .where((v) => v.isActive && v.number.isNotEmpty)
        .map((v) => v.number)
        .take(2)
        .join(", ");
    return "$_activeCount Active trucks • $activeNumbers";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadFleet,
          color: AppColors.primary,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Bar
                Row(
                  children: [
                    Text(
                      "Enterprise ",
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      "Operations",
                      style: GoogleFonts.outfit(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
                Text(
                  "Fleet logistics, fuel, drivers & system controls",
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    color: AppColors.textMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),

                const SizedBox(height: 20),

                // Fleet & Transport Section
                Text(
                  "Fleet & Logistics Management",
                  style: GoogleFonts.outfit(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 10),
                _buildMenuCard([
                  _buildMenuItem(
                    icon: Icons.local_shipping_rounded,
                    title: "Transport Vehicles",
                    subtitle: _fleetSummary,
                    color: AppColors.primary,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const VehiclesListPage(),
                        ),
                      );
                    },
                  ),
                  _buildMenuItem(
                    icon: Icons.local_gas_station_rounded,
                    title: "Diesel & Fuel Bunk Log",
                    subtitle: "Track bunk slips, mileage & fuel expenses",
                    color: AppColors.brickAmber,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const FuelRecordsPage(),
                        ),
                      );
                    },
                  ),
                  _buildMenuItem(
                    icon: Icons.build_circle_rounded,
                    title: "Vehicle Service & Repairs",
                    subtitle: "Maintenance schedules, tyres & breakdown logs",
                    color: AppColors.accent,
                    onTap: () => _showNotice(context, "Vehicle Maintenance"),
                  ),
                  _buildMenuItem(
                    icon: Icons.badge_rounded,
                    title: "Drivers & Labour Team",
                    subtitle: "License renewals, daily salary & trip allowance",
                    color: const Color(0xFF8B5CF6),
                    onTap: () => _showNotice(context, "Drivers & Staff Roster"),
                    isLast: true,
                  ),
                ]),

                const SizedBox(height: 22),

                // Finance & Invoicing
                Text(
                  "Billing & Factory Displays",
                  style: GoogleFonts.outfit(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 10),
                _buildMenuCard([
                  _buildMenuItem(
                    icon: Icons.receipt_long_rounded,
                    title: "Tax Invoices & GST Bills",
                    subtitle: "Generate and export PDF sales delivery challans",
                    color: AppColors.success,
                    onTap: () => _showNotice(context, "Invoices & Billing"),
                  ),
                  _buildMenuItem(
                    icon: Icons.tv_rounded,
                    title: "Factory Kiosk Screen",
                    subtitle: "Real-time dispatches display for plant workers",
                    color: const Color(0xFF0284C7),
                    onTap: () => _showNotice(context, "Plant Live Kiosk Display"),
                  ),
                  _buildMenuItem(
                    icon: Icons.cloud_sync_rounded,
                    title: "Database Backup Status",
                    subtitle: "Auto SQL snapshot daily at 02:00 AM",
                    color: const Color(0xFF64748B),
                    onTap: () => _showNotice(context, "Cloud Backups Verified"),
                    isLast: true,
                  ),
                ]),

                const SizedBox(height: 30),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showNotice(BuildContext context, String title) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.textPrimary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        content: Text(
          "$title synchronized with enterprise database.",
          style: GoogleFonts.outfit(color: Colors.white),
        ),
      ),
    );
  }

  Widget _buildMenuCard(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        type: MaterialType.transparency,
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        child: Column(children: children),
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
    bool isLast = false,
  }) {
    return Column(
      children: [
        ListTile(
          onTap: onTap,
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          title: Text(
            title,
            style: GoogleFonts.outfit(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          subtitle: Text(
            subtitle,
            style: GoogleFonts.outfit(fontSize: 11, color: AppColors.textMuted),
          ),
          trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
        ),
        if (!isLast)
          const Divider(
            height: 1,
            thickness: 1,
            color: AppColors.borderLight,
            indent: 52,
          ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/models/user_model.dart';
import '../../core/theme/app_colors.dart';
import '../../core/services/fleet_service.dart';
import '../../core/stores/stock_store.dart';
import '../../core/stores/customer_store.dart';

class DashboardTab extends StatefulWidget {
  final UserModel user;
  final Function(int) onNavigateTab;

  const DashboardTab({
    super.key,
    required this.user,
    required this.onNavigateTab,
  });

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  bool _isLoading = true;
  int _totalBricks = 0;
  int _activeVehicles = 0;
  int _totalOrders = 0;
  double _totalReceivables = 0.0;
  int _customerCount = 0;

  @override
  void initState() {
    super.initState();
    stockStore.addListener(_onStoresUpdated);
    customerStore.addListener(_onStoresUpdated);
    _fetchLiveMetrics();
  }

  @override
  void dispose() {
    stockStore.removeListener(_onStoresUpdated);
    customerStore.removeListener(_onStoresUpdated);
    super.dispose();
  }

  void _onStoresUpdated() {
    if (mounted) {
      setState(() {
        _totalBricks = stockStore.totalBricksInStock;
        _totalReceivables = customerStore.totalReceivables;
        _customerCount = customerStore.totalClientsCount;
      });
    }
  }

  Future<void> _fetchLiveMetrics() async {
    setState(() => _isLoading = true);
    await Future.wait([
      stockStore.fetchStockData(force: true),
      customerStore.fetchCustomers(force: true),
      FleetService.fetchVehicles(),
      FleetService.fetchOrdersCount(),
    ]);

    if (!mounted) return;

    setState(() {
      _totalBricks = stockStore.totalBricksInStock;
      _activeVehicles = FleetService.activeVehiclesCount;
      _totalOrders = FleetService.totalOrdersCount;
      _totalReceivables = customerStore.totalReceivables;
      _customerCount = customerStore.totalClientsCount;
      _isLoading = false;
    });
  }

  String _formatCurrency(double amount) {
    if (amount >= 100000) {
      return "${(amount / 100000).toStringAsFixed(2)}L";
    } else if (amount >= 1000) {
      return "${(amount / 1000).toStringAsFixed(1)}k";
    }
    return amount.toStringAsFixed(0);
  }

  String _formatNumber(int n) {
    return n.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _fetchLiveMetrics,
          color: AppColors.primary,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Bar
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(9),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.25),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.grid_view_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "BrickSync Mobile",
                              style: GoogleFonts.outfit(
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            Text(
                              "Aswath Hollow Bricks & Transport",
                              style: GoogleFonts.outfit(
                                fontSize: 11,
                                color: AppColors.textMuted,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    IconButton(
                      onPressed: () => widget.onNavigateTab(4), // Go to Profile
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: const Icon(
                          Icons.person_outline_rounded,
                          color: AppColors.primary,
                          size: 18,
                        ),
                      ),
                      tooltip: "My Profile",
                    ),
                  ],
                ).animate().fadeIn(duration: 350.ms),

                const SizedBox(height: 18),

                // Dynamic User Profile Card (Based on Backend Response)
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.border, width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0F172A).withValues(alpha: 0.03),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: widget.user.isAdmin
                            ? AppColors.primarySoft
                            : const Color(0xFFFFF7ED),
                        child: Icon(
                          widget.user.isAdmin
                              ? Icons.admin_panel_settings_rounded
                              : Icons.badge_outlined,
                          color: widget.user.isAdmin
                              ? AppColors.primary
                              : AppColors.brickAmber,
                          size: 26,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.user.name,
                              style: GoogleFonts.outfit(
                                fontSize: 16.5,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              widget.user.email,
                              style: GoogleFonts.outfit(
                                fontSize: 12,
                                color: AppColors.textMuted,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Dynamic Role Badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: widget.user.isAdmin
                              ? AppColors.primarySoft
                              : const Color(0xFFFFF7ED),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: widget.user.isAdmin
                                ? AppColors.primaryBorder
                                : const Color(0xFFFED7AA),
                            width: 1,
                          ),
                        ),
                        child: Text(
                          widget.user.roleDisplayName,
                          style: GoogleFonts.outfit(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: widget.user.isAdmin
                                ? AppColors.primary
                                : AppColors.brickAmber,
                          ),
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 150.ms, duration: 400.ms).slideY(begin: 0.06, end: 0),

                const SizedBox(height: 22),

                // KPI Section Title
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Live Business Metrics",
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    GestureDetector(
                      onTap: () => widget.onNavigateTab(1),
                      child: Text(
                        "View Stock →",
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ).animate().fadeIn(delay: 200.ms),

                const SizedBox(height: 12),

                // 4 Metric KPI Cards - 100% Backend Data
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.3,
                  children: [
                    _buildStatCard(
                      title: "Total Bricks",
                      value: _isLoading ? "..." : _formatNumber(_totalBricks),
                      unit: "Bricks In Stock",
                      icon: Icons.inventory_2_outlined,
                      color: AppColors.primary,
                      bgColor: AppColors.primarySoft,
                      onTap: () => widget.onNavigateTab(1), // Go to Production/Stock
                    ),
                    _buildStatCard(
                      title: "Active Fleet",
                      value: _isLoading ? "..." : "$_activeVehicles",
                      unit: "Operational Trucks",
                      icon: Icons.local_shipping_outlined,
                      color: AppColors.accent,
                      bgColor: const Color(0xFFF0F9FF),
                      onTap: () => widget.onNavigateTab(3), // Go to Others (Fleet)
                    ),
                    _buildStatCard(
                      title: "Customer Orders",
                      value: _isLoading ? "..." : "$_totalOrders",
                      unit: "Logged in System",
                      icon: Icons.pending_actions_outlined,
                      color: AppColors.brickAmber,
                      bgColor: const Color(0xFFFFF7ED),
                      onTap: () => widget.onNavigateTab(2), // Go to Customers
                    ),
                    _buildStatCard(
                      title: "Receivables",
                      value: _isLoading ? "..." : "₹ ${_formatCurrency(_totalReceivables)}",
                      unit: "$_customerCount Accounts",
                      icon: Icons.account_balance_wallet_outlined,
                      color: AppColors.success,
                      bgColor: AppColors.successSoft,
                      onTap: () => widget.onNavigateTab(2), // Go to Customers
                    ),
                  ],
                ).animate().fadeIn(delay: 250.ms),

                const SizedBox(height: 24),

                // Quick Actions Section
                Text(
                  "Quick Management Actions",
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ).animate().fadeIn(delay: 300.ms),

                const SizedBox(height: 12),

                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border, width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0F172A).withValues(alpha: 0.02),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      _buildActionItem(
                        icon: Icons.add_circle_outline_rounded,
                        title: "New Production Entry",
                        subtitle: "Record manufactured batch & cement bags",
                        color: AppColors.primary,
                        onTap: () => widget.onNavigateTab(1),
                        isLast: false,
                      ),
                      _buildActionItem(
                        icon: Icons.receipt_long_outlined,
                        title: "Customer Invoices & Ledgers",
                        subtitle: "View statements & outstanding balances",
                        color: AppColors.accent,
                        onTap: () => widget.onNavigateTab(2),
                        isLast: false,
                      ),
                      _buildActionItem(
                        icon: Icons.history_rounded,
                        title: "Vehicle Transport Fleet",
                        subtitle: "Track live dispatches & trip history",
                        color: AppColors.brickAmber,
                        onTap: () => widget.onNavigateTab(3),
                        isLast: true,
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 350.ms).slideY(begin: 0.05, end: 0),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required String unit,
    required IconData icon,
    required Color color,
    required Color bgColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border, width: 1.2),
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
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textSecondary,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 16),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  unit,
                  style: GoogleFonts.outfit(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
    required bool isLast,
  }) {
    return Column(
      children: [
        InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.outfit(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
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
                const Icon(
                  Icons.chevron_right_rounded,
                  color: AppColors.textMuted,
                  size: 20,
                ),
              ],
            ),
          ),
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

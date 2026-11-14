import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/models/user_model.dart';
import '../core/theme/app_colors.dart';
import '../core/stores/stock_store.dart';
import '../core/stores/customer_store.dart';
import 'tabs/dashboard_tab.dart';
import 'tabs/production_tab.dart';
import 'tabs/customer_tab.dart';
import 'tabs/others_tab.dart';
import 'tabs/profile_tab.dart';
import 'login_screen.dart';

class DashboardScreen extends StatefulWidget {
  final UserModel user;

  const DashboardScreen({
    super.key,
    required this.user,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;

  void _onSelectTab(int index) {
    if (_currentIndex != index) {
      setState(() => _currentIndex = index);

      // Automatically fetch latest data from backend on tab switch (Zustand reactive store)
      if (index == 1) {
        // Switched to Product / Production tab -> auto-fetch stock & production history from backend
        stockStore.fetchStockData(force: true);
        stockStore.fetchProductionHistory(force: true);
      } else if (index == 2) {
        // Switched to Customer tab -> auto-fetch customer accounts & ledgers from backend
        customerStore.fetchCustomers(force: true);
      } else if (index == 0) {
        // Switched to Dashboard tab -> refresh metrics from backend
        stockStore.fetchStockData(force: false);
        customerStore.fetchCustomers(force: false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final tabs = [
      DashboardTab(
        user: widget.user,
        onNavigateTab: _onSelectTab,
      ),
      const ProductionTab(),
      const CustomerTab(),
      const OthersTab(),
      ProfileTab(
        user: widget.user,
        onLogout: () {
          Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const LoginScreen()),
            (route) => false,
          );
        },
      ),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: IndexedStack(
        index: _currentIndex,
        children: tabs,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(
            top: BorderSide(color: AppColors.border, width: 1.1),
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withValues(alpha: 0.04),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, Icons.grid_view_rounded, "Dashboard"),
                _buildNavItem(1, Icons.inventory_2_rounded, "Production"),
                _buildNavItem(2, Icons.people_alt_rounded, "Customer"),
                _buildNavItem(3, Icons.widgets_rounded, "Others"),
                _buildNavItem(4, Icons.person_rounded, "Profile"),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () => _onSelectTab(index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: EdgeInsets.symmetric(
          horizontal: isSelected ? 12 : 10,
          vertical: 6,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primarySoft : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 22,
              color: isSelected ? AppColors.primary : AppColors.textMuted,
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: GoogleFonts.outfit(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? AppColors.primary : AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

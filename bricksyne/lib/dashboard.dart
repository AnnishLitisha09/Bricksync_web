import 'dart:async';
import 'package:flutter/material.dart';
import 'services/api_service.dart';
import 'login_page.dart';
import 'profile_page.dart';

class Dashboard extends StatefulWidget {
  const Dashboard({super.key});

  @override
  State<Dashboard> createState() => _DashboardState();
}

class _DashboardState extends State<Dashboard> with TickerProviderStateMixin {
  // ── State ──────────────────────────────────────────────────────────────────
  String _driverName = 'Driver';
  double _vehicleSpeed = 0;
  String _vehicleNumber = '—';
  int _daysPresent = 0;
  bool _speedLoading = false;
  bool _loadingData = true;
  Timer? _refreshTimer;
  bool? _isPresentToday;
  Timer? _absentTimer;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    _loadAllData();
    // Initialize real-time speed tracking via Socket
    _initSocket();
    _startAutoRefresh();
  }

  void _startAutoRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (timer) {
      if (_isPresentToday == true) {
        _loadAllData();
      }
    });
  }

  void _startAbsentTimer() {
    _absentTimer?.cancel();
    _absentTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      if (_isPresentToday == false) {
        _loadAllData();
      }
    });
  }

  void _initSocket() {
    ApiService.connectSocket(
      vehicleNumber: _vehicleNumber,
      onSpeedUpdate: (speed) {
        if (mounted) {
          setState(() {
            _vehicleSpeed = speed;
            _speedLoading = false;
          });
        }
      },
      onStatusUpdate: (status) {
        if (mounted) {
          print('Socket Status: $status');
        }
      },
    );
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _absentTimer?.cancel();
    ApiService.disposeSocket();
    super.dispose();
  }

  // ── Data loading ───────────────────────────────────────────────────────────

  Future<void> _loadAllData() async {
    // Show main loader only on first load
    if (_isPresentToday == null) {
      setState(() => _loadingData = true);
    }
    try {
      final now = DateTime.now();

      // 0. Check Attendance First
      final isPresent = await ApiService.checkTodayAttendance();
      if (!mounted) return;

      if (!isPresent) {
        setState(() {
          _isPresentToday = false;
          _loadingData = false;
        });
        _startAbsentTimer();
        return;
      }

      setState(() => _isPresentToday = true);
      _absentTimer?.cancel();
      final profile = await ApiService.getUserProfile();
      if (!mounted) return;

      final name = profile != null
          ? (profile['name'] ?? 'Driver').toString()
          : await ApiService.getUserName();

      // 2. Fetch Vehicle & Attendance (can be parallel)
      final results = await Future.wait([
        ApiService.getMyVehicleRecord(),
        ApiService.getMonthlyPresentCount(year: now.year, month: now.month),
      ]);

      if (!mounted) return;

      final vehicle = results[0] as Map<String, dynamic>?;
      final present = results[1] as int;

      setState(() {
        _driverName = name;
        _vehicleNumber = (vehicle?['vehicleNumber'] as String?) ?? '—';
        _vehicleSpeed = (vehicle?['speed'] as num?)?.toDouble() ?? 0;
        _daysPresent = present;
        _loadingData = false;
      });

      print('--- DASHBOARD DATA LOADED ---');
      print('Driver: $_driverName');
      print('Vehicle: $_vehicleNumber');
      print('Speed: $_vehicleSpeed');
      print('Attendance: $_daysPresent days');
      print('-----------------------------');

      // 3. (Re)connect socket with correct userId/token
      _initSocket();
    } catch (e) {
      if (mounted) setState(() => _loadingData = false);
      print('Dashboard Load Error: $e');
    }
  }

  /// Lightweight speed-only refresh (called by timer).
  Future<void> _refreshSpeed() async {
    if (_vehicleNumber == '—') return; // no vehicle assigned yet
    try {
      setState(() => _speedLoading = true);
      final vehicle = await ApiService.getMyVehicleRecord();
      if (!mounted) return;
      setState(() {
        _vehicleSpeed = (vehicle?['speed'] as num?)?.toDouble() ?? 0;
        if (vehicle != null) {
          _vehicleNumber =
              vehicle['vehicleNumber'] as String? ?? _vehicleNumber;
        }
        _speedLoading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _speedLoading = false);
    }
  }

  Future<void> _handleLogout() async {
    await ApiService.logout();
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginPage()),
    );
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final monthYear = '${_getMonthName(now.month)} ${now.year}';
    final daysInMonth = DateUtils.getDaysInMonth(now.year, now.month);
    final greeting = _getGreeting();

    if (_isPresentToday == null || _loadingData) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFF0F172A)),
        ),
      );
    }

    if (_isPresentToday == false) {
      return _buildAbsentView();
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: RefreshIndicator(
        onRefresh: _loadAllData,
        color: Colors.blueAccent,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            children: [
              // ── HEADER ──────────────────────────────────────────────────────
              Stack(
                clipBehavior: Clip.none,
                children: [
                  _buildModernHeader(),
                  SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 10,
                      ),
                      child: Column(
                        children: [
                          _buildTopBar(),
                          const SizedBox(height: 10),
                          _buildProfileCard(greeting, monthYear, daysInMonth),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // ── VEHICLE SPEED CARD ──────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _buildVehicleSpeedCard(),
              ),

              const SizedBox(height: 20),

              // ── QUICK STATS ─────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _buildQuickStatsRow(),
              ),

              const SizedBox(height: 28),

              // ── FLEET MANAGEMENT GRID ───────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionHeader('Fleet Management'),
                    const SizedBox(height: 16),
                    _buildAnimatedGrid(),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // ── PERFORMANCE CARD ────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: _buildPerformanceCard(),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  // ── Widget builders ────────────────────────────────────────────────────────

  Widget _buildModernHeader() {
    return Container(
      height: 200,
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(40),
          bottomRight: Radius.circular(40),
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'BrickSync',
              style: TextStyle(
                color: Colors.white,
                fontSize: 26,
                fontWeight: FontWeight.w900,
                letterSpacing: -1,
              ),
            ),
            Text(
              'Driver Operations',
              style: TextStyle(
                color: Colors.white54,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        Row(
          children: [
            Container(
              height: 45,
              width: 45,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(15),
              ),
              child: const Icon(
                Icons.notifications_active_outlined,
                color: Colors.white,
                size: 22,
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: _handleLogout,
              child: Container(
                height: 45,
                width: 45,
                decoration: BoxDecoration(
                  color: Colors.redAccent.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: const Icon(
                  Icons.logout_rounded,
                  color: Colors.redAccent,
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Profile card showing greeting + driver name + attendance bar.
  Widget _buildProfileCard(
    String greetingPrefix,
    String monthYear,
    int daysInMonth,
  ) {
    return Container(
      margin: const EdgeInsets.only(top: 15),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withOpacity(0.08),
            blurRadius: 30,
            offset: const Offset(0, 15),
          ),
        ],
      ),
      child: Row(
        children: [
          _buildDriverAvatar(),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // e.g. "GOOD AFTERNOON, ASWATH 👋"
                Text(
                  _loadingData
                      ? greetingPrefix
                      : '$greetingPrefix, ${_driverName.split(' ').first.toUpperCase()} 👋',
                  style: TextStyle(
                    color: Colors.blueAccent.shade700,
                    fontWeight: FontWeight.w800,
                    fontSize: 11,
                    letterSpacing: 0.5,
                  ),
                ),
                Text(
                  _loadingData ? '...' : _driverName,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF1E293B),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 10),
                _buildAnimatedAttendance(_daysPresent, daysInMonth, monthYear),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAbsentView() {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(40.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.event_busy_rounded,
                  size: 80,
                  color: Colors.red.shade400,
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'Access Restricted',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF0F172A),
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'You are marked as ABSENT for today. Please contact the Admin to verify and mark your attendance to unlock the dashboard.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 15,
                  color: Colors.blueGrey.shade600,
                  height: 1.5,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 48),
              _buildModernButton(
                onTap: _loadAllData,
                icon: Icons.refresh_rounded,
                label: 'CHECK STATUS NOW',
                color: const Color(0xFF0F172A),
              ),
              const SizedBox(height: 16),
              _buildModernButton(
                onTap: _handleLogout,
                icon: Icons.logout_rounded,
                label: 'LOGOUT',
                color: Colors.redAccent,
              ),
              const SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.blueGrey,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Auto-checking every 10s...',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.blueGrey.shade400,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModernButton({
    required VoidCallback onTap,
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, size: 18),
        label: Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 20),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          elevation: 0,
        ),
      ),
    );
  }

  Widget _buildDriverAvatar() {
    final initial = _driverName.isNotEmpty ? _driverName[0].toUpperCase() : 'D';
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const ProfilePage()),
        );
      },
      child: Stack(
        alignment: Alignment.bottomRight,
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: Colors.blueAccent.withOpacity(0.2),
                width: 2,
              ),
            ),
            child: CircleAvatar(
              radius: 32,
              backgroundColor: const Color(0xFF0D47A1),
              child: Text(
                initial,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const CircleAvatar(
            radius: 8,
            backgroundColor: Colors.green,
            child: Icon(Icons.check, size: 10, color: Colors.white),
          ),
        ],
      ),
    );
  }

  Widget _buildAnimatedAttendance(int present, int total, String date) {
    final progress = total > 0 ? (present / total).clamp(0.0, 1.0) : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              date,
              style: const TextStyle(
                fontSize: 11,
                color: Colors.blueGrey,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              _loadingData
                  ? '...'
                  : '$present / $total days  •  ${(progress * 100).toInt()}%',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w900,
                color: Colors.blueAccent,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        TweenAnimationBuilder<double>(
          tween: Tween<double>(begin: 0, end: progress),
          duration: const Duration(seconds: 1),
          builder: (context, value, child) {
            return ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                value: value,
                backgroundColor: Colors.blueGrey.withOpacity(0.08),
                color: Colors.blueAccent,
                minHeight: 8,
              ),
            );
          },
        ),
      ],
    );
  }

  /// Live-speed card with animated colour based on speed range.
  Widget _buildVehicleSpeedCard() {
    final speedColor = _vehicleSpeed > 75
        ? Colors.red
        : _vehicleSpeed > 40
        ? Colors.orange
        : _vehicleSpeed > 0
        ? Colors.green
        : Colors.blueGrey;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [const Color(0xFF0F172A), speedColor.withOpacity(0.6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: speedColor.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          // Circular speed indicator
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: speedColor.withOpacity(0.4), width: 3),
              color: Colors.white.withOpacity(0.05),
            ),
            child: (_loadingData || _speedLoading)
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _vehicleSpeed.toInt().toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          height: 1,
                        ),
                      ),
                      Text(
                        'km/h',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.6),
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: _vehicleSpeed > 0
                            ? Colors.greenAccent
                            : Colors.grey,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _vehicleSpeed > 0 ? 'VEHICLE ACTIVE' : 'VEHICLE IDLE',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.6),
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  _vehicleNumber,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _loadingData
                      ? 'Loading...'
                      : (_vehicleNumber == '—'
                            ? 'No vehicle assigned'
                            : 'Assigned to $_driverName'),
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.5),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                // Last refreshed hint
                Row(
                  children: [
                    Icon(
                      Icons.refresh_rounded,
                      color: Colors.white30,
                      size: 10,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Live updates via WebSocket',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.3),
                        fontSize: 9,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Manual refresh button
          GestureDetector(
            onTap: () async {
              await _refreshSpeed();
            },
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(
                Icons.refresh_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickStatsRow() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildMiniStat(
            Icons.bolt_rounded,
            'Live Speed',
            (_loadingData || _speedLoading)
                ? '...'
                : '${_vehicleSpeed.toInt()} km/h',
            Colors.orange,
          ),
          _buildMiniStat(
            Icons.calendar_today_outlined,
            'Days Present',
            _loadingData ? '...' : '$_daysPresent days',
            Colors.blue,
          ),
          _buildMiniStat(
            Icons.verified_user_outlined,
            'Health',
            'Excellent',
            Colors.green,
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStat(
    IconData icon,
    String label,
    String value,
    Color color,
  ) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 18, color: color),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: 14,
            color: Color(0xFF1E293B),
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 9,
            color: Colors.blueGrey,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildAnimatedGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 20,
      mainAxisSpacing: 20,
      childAspectRatio: 1.1,
      children: [
        _buildActionCard(
          'Trips',
          Icons.route_rounded,
          Colors.blue,
          'Next: 2:00 PM',
        ),
        _buildActionCard(
          'Fuel Log',
          Icons.local_gas_station_rounded,
          Colors.deepOrange,
          'Last: 45 L',
        ),
        _buildActionCard(
          'Service',
          Icons.build_circle_rounded,
          Colors.teal,
          'In 3 Days',
        ),
        _buildActionCard(
          'E-Docs',
          Icons.fact_check_rounded,
          Colors.indigo,
          'Verified',
        ),
      ],
    );
  }

  Widget _buildActionCard(
    String title,
    IconData icon,
    Color color,
    String desc,
  ) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0.9, end: 1.0),
      duration: const Duration(milliseconds: 400),
      builder: (context, val, child) {
        return Transform.scale(
          scale: val,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: color.withOpacity(0.06),
                  blurRadius: 15,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {},
                borderRadius: BorderRadius.circular(28),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(15),
                        ),
                        child: Icon(icon, color: color, size: 24),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 16,
                              color: Color(0xFF1E293B),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            desc,
                            style: const TextStyle(
                              fontSize: 11,
                              color: Colors.blueGrey,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildPerformanceCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E293B), Color(0xFF334155)],
        ),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              CircularProgressIndicator(
                value: 0.98,
                strokeWidth: 4,
                color: Colors.amber.shade400,
                backgroundColor: Colors.white10,
              ),
              const Text(
                '98',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(width: 20),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Safety Excellence',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                  ),
                ),
                Text(
                  'Awarded Top Driver of March',
                  style: TextStyle(
                    color: Colors.white60,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.arrow_forward_ios_rounded,
            color: Colors.amber,
            size: 18,
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: Color(0xFF1E293B),
            letterSpacing: -0.5,
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.blueAccent.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Text(
            'View All',
            style: TextStyle(
              color: Colors.blueAccent,
              fontSize: 11,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
      ],
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  }

  String _getMonthName(int month) {
    return [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ][month - 1];
  }
}

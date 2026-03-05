import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

// ─── BASE URL ────────────────────────────────────────────────────────────────
// Android emulator → 10.0.2.2, physical device → your LAN IP
const String _baseUrl = 'https://3ncmhqdf-3000.inc1.devtunnels.ms/api';
// ^^^  port must be 3000  ^^^

class ApiService {
  // ──────────────────────────────────── AUTH ───────────────────────────────────

  /// Login → stores token, userName, userId in SharedPreferences.
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    http.Response response;
    try {
      response = await http
          .post(
            Uri.parse('$_baseUrl/auth/login'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(
            const Duration(seconds: 15),
            onTimeout: () => throw Exception(
              'Connection timed out — make sure the server is running and '
              'your phone is on the same Wi-Fi as the server.',
            ),
          );
    } on SocketException {
      throw Exception(
        'Cannot reach the server (192.168.3.1:3000).\n'
        '• Make sure your phone and server are on the same Wi-Fi network.\n'
        '• Confirm the backend is running on port 3000.',
      );
    } on http.ClientException {
      throw Exception(
        'Network error — no route to host.\n'
        '• Check that the server IP (192.168.3.1) is correct.\n'
        '• Try running: ping 192.168.3.1 from your terminal.',
      );
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode == 200 && data['token'] != null) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', data['token'] as String);

      try {
        await getUserProfile();
      } catch (e) {
        print('Profile fetch error: $e');
        // If profile fetch fails, we still have the token stored.
        // We can try to set a default name if it was not in the login response.
        final user = data['user'] as Map<String, dynamic>? ?? {};
        final name = (user['name'] ?? '').toString().trim();
        if (name.isNotEmpty) {
          await prefs.setString('userName', name);
        }
      }
      return data;
    } else {
      throw Exception(data['message'] ?? 'Login failed');
    }
  }

  /// Fetches the full user profile and updates SharedPreferences.
  static Future<Map<String, dynamic>?> getUserProfile() async {
    final token = await getToken();
    if (token == null) return null;

    print('--- API REQUEST (PROFILE) ---');
    print('curl --location "$_baseUrl/user/profile" \\');
    print('     --header "Authorization: Bearer $token"');
    print('-----------------------------');

    try {
      final response = await http
          .get(
            Uri.parse('$_baseUrl/user/profile'),
            headers: {'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final profileData = jsonDecode(response.body) as Map<String, dynamic>;
        final prefs = await SharedPreferences.getInstance();

        final name = (profileData['name'] ?? '').toString().trim();
        final email = (profileData['email'] ?? '').toString().trim();
        final phone = (profileData['phoneNumber'] ?? '').toString().trim();
        final userId = profileData['userid'] ?? 0;
        final role = (profileData['staffRole'] ?? profileData['userRole'] ?? '')
            .toString();

        await prefs.setString('userName', name);
        await prefs.setString('userEmail', email);
        await prefs.setString('userPhone', phone);
        await prefs.setString('userRole', role);
        await prefs.setInt(
          'userId',
          userId is int ? userId : int.tryParse(userId.toString()) ?? 0,
        );

        print('--- USER PROFILE FETCHED ---');
        print('User ID: $userId');
        print('Name: $name');
        print('Email: $email');
        print('Phone: $phone');
        print('Role: $role');
        print('----------------------------');

        return profileData;
      } else {
        print(
          'Failed to fetch profile: ${response.statusCode} ${response.body}',
        );
        return null;
      }
    } catch (e) {
      print('Profile fetch error: $e');
      return null;
    }
  }

  /// Returns the stored JWT token (or null if not logged in).
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  /// Clears stored session (logout).
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  /// Returns the stored user name.
  static Future<String> getUserName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('userName') ?? 'Driver';
  }

  /// Returns the stored user ID (0 if not found).
  static Future<int> getUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('userId') ?? 0;
  }

  // ──────────────────────────────────── GPRS ───────────────────────────────────

  /// Fetches all GPRS records and returns the vehicle assigned to this driver.
  ///
  /// Matching strategy (most-reliable first):
  ///  1. Exact case-insensitive match on the full name.
  ///  2. The stored name contains the record's first word (and vice-versa).
  ///  3. Levenshtein distance ≤ 2 on first tokens.
  ///
  /// Returns null when no vehicle is found.
  static Future<Map<String, dynamic>?> getMyVehicleRecord() async {
    final token = await getToken();
    final userId = await getUserId();

    if (token == null || userId == 0) return null;

    try {
      final response = await http
          .get(
            Uri.parse('$_baseUrl/gprs/summary'),
            headers: {'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode != 200) return null;

      final List<dynamic> vehicles = jsonDecode(response.body) as List<dynamic>;

      for (final raw in vehicles) {
        final v = raw as Map<String, dynamic>;

        // Primary Match: by userId
        final mappedUserId = v['userid'] ?? v['userId'];
        if (mappedUserId != null &&
            mappedUserId.toString() == userId.toString()) {
          return v;
        }
      }

      // Fallback Match: by driverName (case-insensitive)
      final userName = await getUserName();
      if (userName.isNotEmpty && userName.toLowerCase() != 'driver') {
        for (final raw in vehicles) {
          final v = raw as Map<String, dynamic>;
          final dName = (v['driverName'] ?? v['assignedDriver'] ?? '')
              .toString();

          if (dName.toLowerCase().trim() == userName.toLowerCase().trim()) {
            return v;
          }
        }
      }
    } catch (_) {}
    return null;
  }

  // ──────────────────────────────────── SOCKET ─────────────────────────────────

  static IO.Socket? _socket;

  /// Connects to Socket.io and listens for updates.
  /// The 'onUpdate' callback will receive speed updates.
  static void connectSocket({
    String? vehicleNumber,
    required Function(double speed) onSpeedUpdate,
    required Function(String status) onStatusUpdate,
  }) async {
    final token = await getToken();
    if (token == null) return;

    // Dev tunnel or LAN IP (strip /api)
    final socketUrl = _baseUrl.replaceAll('/api', '');

    _socket = IO.io(socketUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {'token': token},
    });

    _socket!.connect();

    _socket!.onConnect((_) {
      print('Socket Connected');
      onStatusUpdate('Connected');

      if (vehicleNumber != null && vehicleNumber != '—') {
        print('Joining Vehicle Room: $vehicleNumber');
        _socket!.emit('join-vehicle', vehicleNumber);
      } else {
        // Fallback for general dashboard updates if needed
        _socket!.emit('join-dashboard');
      }
    });

    // Listen for telemetry updates (sync with backend)
    _socket!.on('telemetry-update', (data) {
      if (data != null && data['speed'] != null) {
        final speed = (data['speed'] as num).toDouble();
        onSpeedUpdate(speed);
      }
    });

    _socket!.onDisconnect((_) {
      print('Socket Disconnected');
      onStatusUpdate('Disconnected');
    });

    _socket!.onConnectError((err) => print('Socket Connect Error: $err'));
  }

  static void disposeSocket() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  /// Convenience: returns just the speed for the driver's vehicle.
  static Future<double> getMyVehicleSpeed() async {
    final vehicle = await getMyVehicleRecord();
    return (vehicle?['speed'] as num?)?.toDouble() ?? 0;
  }

  // ──────────────────────────────────── ATTENDANCE ─────────────────────────────

  /// Returns the number of days present in a given month/year for this driver.
  /// Calls GET /api/attendance/monthly-count?userid=X&year=Y&month=M
  static Future<int> getMonthlyPresentCount({
    required int year,
    required int month,
  }) async {
    final token = await getToken();
    final userId = await getUserId();
    if (token == null || userId == 0) return 0;

    try {
      final uri = Uri.parse('$_baseUrl/attendance/monthly-count').replace(
        queryParameters: {
          'userid': userId.toString(),
          'year': year.toString(),
          'month': month.toString().padLeft(2, '0'),
        },
      );

      final response = await http
          .get(uri, headers: {'Authorization': 'Bearer $token'})
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return (data['presentDays'] as num?)?.toInt() ?? 0;
      }
    } catch (_) {}
    return 0;
  }

  /// Checks if the current driver is marked as present for today.
  static Future<bool> checkTodayAttendance() async {
    final token = await getToken();
    final userId = await getUserId();
    if (token == null || userId == 0) return false;

    try {
      final today = DateTime.now().toIso8601String().split('T')[0];
      final uri = Uri.parse(
        '$_baseUrl/attendance/today',
      ).replace(queryParameters: {'date': today});

      final response = await http
          .get(uri, headers: {'Authorization': 'Bearer $token'})
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final List<dynamic> users = jsonDecode(response.body) as List<dynamic>;
        // Find the current user in the list
        final user = users.firstWhere(
          (u) => u['userid'].toString() == userId.toString(),
          orElse: () => null,
        );

        if (user != null && user['Attendances'] != null) {
          final attendances = user['Attendances'] as List<dynamic>;
          if (attendances.isNotEmpty) {
            final first = attendances.first;
            // Mark as present if either forenoon or afternoon is true
            return (first['forenoon'] == true || first['afternoon'] == true);
          }
        }
      }
    } catch (e) {
      print('Check Today Attendance Error: $e');
    }
    return false;
  }
}

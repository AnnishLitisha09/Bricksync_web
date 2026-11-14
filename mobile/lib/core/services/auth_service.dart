import '../models/user_model.dart';
import 'api_client.dart';
import 'storage_service.dart';

class AuthResult {
  final bool success;
  final UserModel? user;
  final String? errorMessage;

  AuthResult.success(this.user)
      : success = true,
        errorMessage = null;

  AuthResult.failure(this.errorMessage)
      : success = false,
        user = null;
}

class AuthService {
  static Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    final cleanEmail = email.trim();
    final cleanPassword = password.trim();

    final res = await ApiClient.post('/auth/login', {
      'email': cleanEmail,
      'password': cleanPassword,
    });

    if (res.isSuccess && res.data != null) {
      final data = res.data;
      final token = data['token']?.toString();
      final role = (data['role'] ?? 1) as int;

      if (token == null || token.isEmpty) {
        return AuthResult.failure("Invalid server authentication token");
      }

      // Save token first so subsequent requests include Authorization header
      await StorageService.saveAuth(
        token: token,
        user: UserModel(
          name: cleanEmail.split('@').first,
          email: cleanEmail,
          userRole: role,
        ),
      );

      // Fetch user profile from /api/user/profile
      final profileRes = await ApiClient.get('/user/profile');
      UserModel finalUser;
      if (profileRes.isSuccess && profileRes.data is Map) {
        finalUser = UserModel.fromJson(profileRes.data as Map<String, dynamic>);
      } else {
        finalUser = UserModel(
          name: cleanEmail.split('@').first,
          email: cleanEmail,
          userRole: role,
        );
      }

      // Persist verified user details
      await StorageService.saveAuth(token: token, user: finalUser);

      return AuthResult.success(finalUser);
    } else {
      return AuthResult.failure(res.error ?? "Invalid email or password");
    }
  }

  /// Verifies current stored session against /api/user/profile.
  /// If valid, refreshes stored user details and returns user.
  /// If invalid or expired, clears local auth and returns null.
  static Future<UserModel?> verifySession() async {
    final token = StorageService.getToken();
    if (token == null || token.trim().isEmpty) {
      return null;
    }

    try {
      final res = await ApiClient.get('/user/profile');
      if (res.isSuccess && res.data is Map) {
        final verifiedUser = UserModel.fromJson(Map<String, dynamic>.from(res.data as Map));
        await StorageService.saveAuth(token: token, user: verifiedUser);
        return verifiedUser;
      } else {
        if (res.statusCode == 401 || res.statusCode == 403) {
          await StorageService.clearAuth();
        }
        return null;
      }
    } catch (_) {
      return null;
    }
  }

  static Future<void> logout() async {
    await StorageService.clearAuth();
  }
}

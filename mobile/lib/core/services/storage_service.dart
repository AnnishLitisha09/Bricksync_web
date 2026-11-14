import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';

class StorageService {
  static SharedPreferences? _prefs;

  static const String _tokenKey = "auth_token";
  static const String _userKey = "user_data";

  static Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  static Future<void> saveAuth({required String token, required UserModel user}) async {
    await _prefs?.setString(_tokenKey, token);
    await _prefs?.setString(_userKey, jsonEncode(user.toJson()));
  }

  static String? getToken() {
    return _prefs?.getString(_tokenKey);
  }

  static UserModel? getUser() {
    final str = _prefs?.getString(_userKey);
    if (str == null || str.isEmpty) return null;
    try {
      final json = jsonDecode(str) as Map<String, dynamic>;
      return UserModel.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  static bool hasToken() {
    final token = getToken();
    return token != null && token.trim().isNotEmpty;
  }

  static Future<void> clearAuth() async {
    await _prefs?.remove(_tokenKey);
    await _prefs?.remove(_userKey);
  }
}

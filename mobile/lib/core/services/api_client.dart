import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'crypto_service.dart';
import 'storage_service.dart';

class ApiResponse {
  final int statusCode;
  final dynamic data;
  final bool isSuccess;
  final String? error;

  ApiResponse({
    required this.statusCode,
    this.data,
    required this.isSuccess,
    this.error,
  });
}

class ApiClient {
  // Live Cloudflare backend tunnel matching the web application
  static const String remoteBaseUrl = "https://rss-driven-call-heard.trycloudflare.com/api";
  static String baseUrl = remoteBaseUrl;

  static bool _isLoggingOut = false;
  static void Function(String message)? onSessionExpired;

  static void _checkAuthFailure(String path, int statusCode, dynamic unwrapped) {
    if (path.contains('/auth/login') || path.contains('/auth/register')) return;

    if (statusCode == 401) {
      _triggerLogout("Session expired. Please sign in again.");
      return;
    }

    if (statusCode == 403) {
      String msg = "";
      if (unwrapped is Map) {
        msg = (unwrapped['message'] ?? unwrapped['error'] ?? '').toString().toLowerCase();
      } else if (unwrapped is String) {
        msg = unwrapped.toLowerCase();
      }
      if (msg.contains("token") || msg.contains("expired") || msg.contains("signature mismatch") || msg.contains("unauthorized")) {
        _triggerLogout("Session expired or invalid. Please sign in again.");
      }
    }
  }

  static void _triggerLogout(String message) {
    if (_isLoggingOut) return;
    _isLoggingOut = true;
    Future.microtask(() async {
      await StorageService.clearAuth();
      _isLoggingOut = false;
      onSessionExpired?.call(message);
    });
  }

  static String _extractErrorMessage(dynamic unwrapped, int statusCode) {
    if (unwrapped is Map) {
      final msg = unwrapped['message']?.toString().trim();
      final err = unwrapped['error']?.toString().trim();

      // If backend returned a specific error detail along with generic "Internal Server Error"
      if (err != null && err.isNotEmpty) {
        if (msg == null || msg.isEmpty || msg == "Internal Server Error") {
          return err;
        }
      }
      if (msg != null && msg.isNotEmpty && msg != "Internal Server Error") {
        return msg;
      }
      if (err != null && err.isNotEmpty) {
        return err;
      }
    } else if (unwrapped is String && unwrapped.trim().isNotEmpty) {
      return unwrapped.trim();
    }
    return "Server returned error $statusCode";
  }

  static List<String> get candidateBases => [remoteBaseUrl];

  static Map<String, String> _buildHeaders() {
    final token = StorageService.getToken() ?? "";
    final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
    final signature = CryptoService.generateSignature(token, timestamp);

    final headers = {
      "Content-Type": "application/json",
      "x-client-timestamp": timestamp,
      "x-client-signature": signature,
      "x-encrypted-transfer": "true",
    };
    if (token.isNotEmpty) {
      headers["Authorization"] = "Bearer $token";
    }
    return headers;
  }

  static Future<ApiResponse> get(String path) async {
    final cleanPath = path.startsWith('/') ? path : '/$path';
    
    // Try candidate base URLs (USB reverse, emulator 10.0.2.2, remote tunnel)
    for (final base in candidateBases) {
      try {
        final url = Uri.parse("$base$cleanPath");
        final response = await http
            .get(url, headers: _buildHeaders())
            .timeout(const Duration(seconds: 5));

        final unwrapped = CryptoService.parseResponse(response.body);

        if (response.statusCode >= 200 && response.statusCode < 300) {
          baseUrl = base; // Stick to working base
          return ApiResponse(
            statusCode: response.statusCode,
            data: unwrapped,
            isSuccess: true,
          );
        } else {
          _checkAuthFailure(cleanPath, response.statusCode, unwrapped);
          if (response.statusCode != 403 && response.statusCode != 404) {
            return ApiResponse(
              statusCode: response.statusCode,
              isSuccess: false,
              error: _extractErrorMessage(unwrapped, response.statusCode),
            );
          }
        }
      } catch (e) {
        if (kDebugMode) print("[ApiClient GET $base$cleanPath failed, trying next]: $e");
      }
    }

    return ApiResponse(
      statusCode: 0,
      isSuccess: false,
      error: "Network error: unable to reach server",
    );
  }

  static Future<ApiResponse> post(String path, dynamic body) async {
    final cleanPath = path.startsWith('/') ? path : '/$path';

    for (final base in candidateBases) {
      try {
        final url = Uri.parse("$base$cleanPath");
        final response = await http
            .post(
              url,
              headers: _buildHeaders(),
              body: jsonEncode(body),
            )
            .timeout(const Duration(seconds: 6));

        final unwrapped = CryptoService.parseResponse(response.body);

        if (response.statusCode >= 200 && response.statusCode < 300) {
          baseUrl = base;
          return ApiResponse(
            statusCode: response.statusCode,
            data: unwrapped,
            isSuccess: true,
          );
        } else {
          _checkAuthFailure(cleanPath, response.statusCode, unwrapped);
          return ApiResponse(
            statusCode: response.statusCode,
            isSuccess: false,
            error: _extractErrorMessage(unwrapped, response.statusCode),
          );
        }
      } catch (e) {
        if (kDebugMode) print("[ApiClient POST $base$cleanPath error]: $e");
      }
    }

    return ApiResponse(
      statusCode: 0,
      isSuccess: false,
      error: "Network error: unable to reach server",
    );
  }

  static Future<ApiResponse> put(String path, dynamic body) async {
    final cleanPath = path.startsWith('/') ? path : '/$path';

    for (final base in candidateBases) {
      try {
        final url = Uri.parse("$base$cleanPath");
        final response = await http
            .put(
              url,
              headers: _buildHeaders(),
              body: jsonEncode(body),
            )
            .timeout(const Duration(seconds: 6));

        final unwrapped = CryptoService.parseResponse(response.body);

        if (response.statusCode >= 200 && response.statusCode < 300) {
          baseUrl = base;
          return ApiResponse(
            statusCode: response.statusCode,
            data: unwrapped,
            isSuccess: true,
          );
        } else {
          _checkAuthFailure(cleanPath, response.statusCode, unwrapped);
          return ApiResponse(
            statusCode: response.statusCode,
            isSuccess: false,
            error: _extractErrorMessage(unwrapped, response.statusCode),
          );
        }
      } catch (e) {
        if (kDebugMode) print("[ApiClient PUT $base$cleanPath error]: $e");
      }
    }

    return ApiResponse(
      statusCode: 0,
      isSuccess: false,
      error: "Network error: unable to reach server",
    );
  }

  static Future<ApiResponse> patch(String path, dynamic body) async {
    final cleanPath = path.startsWith('/') ? path : '/$path';

    for (final base in candidateBases) {
      try {
        final url = Uri.parse("$base$cleanPath");
        final response = await http
            .patch(
              url,
              headers: _buildHeaders(),
              body: jsonEncode(body),
            )
            .timeout(const Duration(seconds: 6));

        final unwrapped = CryptoService.parseResponse(response.body);

        if (response.statusCode >= 200 && response.statusCode < 300) {
          baseUrl = base;
          return ApiResponse(
            statusCode: response.statusCode,
            data: unwrapped,
            isSuccess: true,
          );
        } else {
          _checkAuthFailure(cleanPath, response.statusCode, unwrapped);
          return ApiResponse(
            statusCode: response.statusCode,
            isSuccess: false,
            error: _extractErrorMessage(unwrapped, response.statusCode),
          );
        }
      } catch (e) {
        if (kDebugMode) print("[ApiClient PATCH $base$cleanPath error]: $e");
      }
    }

    return ApiResponse(
      statusCode: 0,
      isSuccess: false,
      error: "Network error: unable to reach server",
    );
  }

  static Future<ApiResponse> delete(String path) async {
    try {
      final cleanPath = path.startsWith('/') ? path : '/$path';
      final url = Uri.parse("$baseUrl$cleanPath");
      final response = await http
          .delete(url, headers: _buildHeaders())
          .timeout(const Duration(seconds: 8));

      final unwrapped = CryptoService.parseResponse(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse(
          statusCode: response.statusCode,
          data: unwrapped,
          isSuccess: true,
        );
      } else {
        _checkAuthFailure(cleanPath, response.statusCode, unwrapped);
        return ApiResponse(
          statusCode: response.statusCode,
          isSuccess: false,
          error: _extractErrorMessage(unwrapped, response.statusCode),
        );
      }
    } catch (e) {
      if (kDebugMode) print("[ApiClient DELETE $path error]: $e");
      return ApiResponse(
        statusCode: 0,
        isSuccess: false,
        error: "Network error: unable to reach server",
      );
    }
  }
}

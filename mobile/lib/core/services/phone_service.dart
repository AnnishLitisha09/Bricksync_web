import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class PhoneService {
  static const MethodChannel _channel = MethodChannel("com.bricksync.app/phone");

  /// Launches the native mobile phone dialer with prefilled number
  static Future<bool> makeCall(String phone) async {
    final clean = phone.replaceAll(RegExp(r'[^0-9+]'), '').trim();
    if (clean.isEmpty) return false;

    try {
      final res = await _channel.invokeMethod<bool>('makePhoneCall', {'phone': clean});
      return res ?? true;
    } catch (e) {
      if (kDebugMode) print("[PhoneService error]: $e");
      return false;
    }
  }
}

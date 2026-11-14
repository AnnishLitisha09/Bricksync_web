import 'package:flutter/services.dart';

class FileShareService {
  static const MethodChannel _channel = MethodChannel('com.bricksync.app/file_share');

  /// Share file via system share sheet to any app (WhatsApp, Email, Telegram, Drive, etc.)
  static Future<bool> shareFile({
    required String filePath,
    String? title,
    String? text,
    String mimeType = 'application/pdf',
  }) async {
    try {
      final res = await _channel.invokeMethod<bool>('shareFile', {
        'filePath': filePath,
        'title': title ?? 'Share Statement',
        'text': text,
        'mimeType': mimeType,
      });
      return res ?? false;
    } catch (e) {
      return false;
    }
  }

  /// View / Open file in system viewer (Chrome, Drive, Acrobat, etc.)
  static Future<bool> viewFile({
    required String filePath,
    String mimeType = 'application/pdf',
  }) async {
    try {
      final res = await _channel.invokeMethod<bool>('viewFile', {
        'filePath': filePath,
        'mimeType': mimeType,
      });
      return res ?? false;
    } catch (e) {
      return false;
    }
  }
}

import 'dart:convert';
import 'dart:typed_data';
import 'package:crypto/crypto.dart' as crypto;
import 'package:encrypt/encrypt.dart' as enc;

class CryptoService {
  static const String secretKey = "sureshaswath05!";

  static enc.Key get _key {
    final keyBytes = crypto.sha256.convert(utf8.encode(secretKey)).bytes;
    return enc.Key(Uint8List.fromList(keyBytes));
  }

  static enc.IV get _iv {
    return enc.IV(Uint8List(16)); // 16 bytes of zero
  }

  /// Generates HMAC-SHA256 signature matching backend verifyClientSignature
  static String generateSignature(String token, String timestamp) {
    final hmac = crypto.Hmac(crypto.sha256, utf8.encode(secretKey));
    final digest = hmac.convert(utf8.encode('$token:$timestamp'));
    return digest.toString();
  }

  /// Decrypts AES-256-CBC hex payload matching BrickSync backend
  static dynamic decryptPayload(String cipherHex) {
    final cleanHex = cipherHex.trim();
    if (cleanHex.isEmpty) return null;

    try {
      final encrypter = enc.Encrypter(
        enc.AES(_key, mode: enc.AESMode.cbc, padding: 'PKCS7'),
      );
      final decryptedStr = encrypter.decrypt(
        enc.Encrypted.fromBase16(cleanHex),
        iv: _iv,
      );

      try {
        return jsonDecode(decryptedStr);
      } catch (_) {
        return decryptedStr;
      }
    } catch (e) {
      return null;
    }
  }

  /// Automatically unwraps response bodies if backend sent an encrypted payload
  static dynamic parseResponse(String rawBody) {
    if (rawBody.trim().isEmpty) return null;

    try {
      final parsed = jsonDecode(rawBody);
      if (parsed is Map && parsed['_encrypted'] == true && parsed['payload'] is String) {
        final decrypted = decryptPayload(parsed['payload'] as String);
        return decrypted ?? parsed;
      }
      return parsed;
    } catch (_) {
      return rawBody;
    }
  }
}

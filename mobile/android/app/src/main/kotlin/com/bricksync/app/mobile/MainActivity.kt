package com.bricksync.app.mobile

import android.content.Intent
import android.net.Uri
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.bricksync.app/phone"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "makePhoneCall") {
                val phoneNumber = call.argument<String>("phone")
                if (!phoneNumber.isNullOrBlank()) {
                    try {
                        val cleanNumber = phoneNumber.replace(Regex("[^0-9+]"), "")
                        val intent = Intent(Intent.ACTION_DIAL).apply {
                            data = Uri.parse("tel:$cleanNumber")
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        }
                        context.startActivity(intent)
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("CALL_ERROR", e.message, null)
                    }
                } else {
                    result.error("INVALID_PHONE", "Phone number is empty", null)
                }
            } else {
                result.notImplemented()
            }
        }
    }
}

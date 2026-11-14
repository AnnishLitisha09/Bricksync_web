package com.bricksync.app.mobile

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File

class MainActivity : FlutterActivity() {
    private val PHONE_CHANNEL = "com.bricksync.app/phone"
    private val FILE_CHANNEL = "com.bricksync.app/file_share"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        // 1. Phone Dialing Channel
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, PHONE_CHANNEL).setMethodCallHandler { call, result ->
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

        // 2. File Sharing & Viewing Channel
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, FILE_CHANNEL).setMethodCallHandler { call, result ->
            val filePath = call.argument<String>("filePath")
            if (filePath.isNullOrBlank()) {
                result.error("INVALID_PATH", "File path is empty", null)
                return@setMethodCallHandler
            }

            val file = File(filePath)
            if (!file.exists()) {
                result.error("FILE_NOT_FOUND", "File does not exist: $filePath", null)
                return@setMethodCallHandler
            }

            // Ensure content URI via FileProvider (with cache fallback to guarantee grant permissions)
            val uri: Uri = try {
                FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
            } catch (e: Exception) {
                try {
                    val cacheFile = File(context.cacheDir, file.name)
                    if (!cacheFile.exists() || cacheFile.length() != file.length()) {
                        file.copyTo(cacheFile, overwrite = true)
                    }
                    FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", cacheFile)
                } catch (e2: Exception) {
                    Uri.fromFile(file)
                }
            }

            when (call.method) {
                "shareFile" -> {
                    try {
                        val title = call.argument<String>("title") ?: "Share Statement"
                        val mimeType = call.argument<String>("mimeType") ?: "application/pdf"
                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                            type = mimeType
                            putExtra(Intent.EXTRA_STREAM, uri)
                            putExtra(Intent.EXTRA_SUBJECT, title)
                            val shareText = call.argument<String>("text")
                            if (!shareText.isNullOrBlank()) {
                                putExtra(Intent.EXTRA_TEXT, shareText)
                            }
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        }

                        val chooser = Intent.createChooser(shareIntent, title).apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
                        }
                        context.startActivity(chooser)
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("SHARE_ERROR", e.message, null)
                    }
                }
                "viewFile" -> {
                    try {
                        val mimeType = call.argument<String>("mimeType") ?: "application/pdf"
                        val viewIntent = Intent(Intent.ACTION_VIEW).apply {
                            setDataAndType(uri, mimeType)
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
                        }

                        val chooser = Intent.createChooser(viewIntent, "Open PDF Statement").apply {
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
                        }
                        context.startActivity(chooser)
                        result.success(true)
                    } catch (e: ActivityNotFoundException) {
                        result.error("NO_APP_FOUND", "No application found to view PDF", null)
                    } catch (e: Exception) {
                        result.error("VIEW_ERROR", e.message, null)
                    }
                }
                else -> result.notImplemented()
            }
        }
    }
}

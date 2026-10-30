"use strict";

const fs = require("fs");
const path = require("path");

const LOGS_DIR = path.join(__dirname, "../logs");
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}
const AUDIT_LOG_FILE = path.join(LOGS_DIR, "security_audit.log");

// In-memory sliding window for rate limiting & burst tracking
const ipRequestCounts = new Map(); // ip -> { count, resetTime }
const ipFailedAttempts = new Map(); // ip -> { count, blockedUntil }

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_MINUTE = 180; // generous for modern SPA with multiple parallel fetches
const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minute cooldown when flagged

/**
 * Logs a security event to file and MySQL database
 */
async function logSecurityThreat(req, threatType, statusCode = 403, details = "") {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";
  const endpoint = req.originalUrl || req.url || "unknown";
  const method = req.method || "UNKNOWN";
  const userId = req.user?.userid || null;
  const userRole = req.user?.userRole || null;
  const timestamp = new Date().toISOString();

  const logEntry = `[${timestamp}] THREAT=${threatType} STATUS=${statusCode} IP=${ip} METHOD=${method} ENDPOINT=${endpoint} USER_ID=${userId || "ANON"} ROLE=${userRole || "NONE"} DETAILS="${details}" UA="${userAgent}"\n`;

  // 1. Write to persistent file
  try {
    fs.appendFile(AUDIT_LOG_FILE, logEntry, () => {});
  } catch (err) {
    console.error("[SecurityLogger] File append failed:", err.message);
  }

  // 2. Write to MySQL SecurityLog model asynchronously
  try {
    const db = require("../models");
    if (db.SecurityLog) {
      await db.SecurityLog.create({
        ip_address: ip,
        endpoint: endpoint.substring(0, 255),
        method: method.substring(0, 10),
        user_id: userId,
        user_role: userRole,
        user_agent: userAgent,
        threat_type: threatType.substring(0, 100),
        status_code: statusCode,
        details: String(details),
      });
    }
  } catch (dbErr) {
    // Non-blocking fallback
    console.error("[SecurityLogger] DB log failed:", dbErr.message);
  }

  console.warn(`🚨 [SECURITY ALERT] ${threatType} from IP: ${ip} on ${method} ${endpoint}`);
}

/**
 * Middleware: Evaluates network rate & flags unwanted repeated access
 */
function networkIntrusionGuard(req, res, next) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const now = Date.now();

  // Check if IP is under cooldown due to previous brute-force/abuse
  const failedRecord = ipFailedAttempts.get(ip);
  if (failedRecord && failedRecord.blockedUntil && failedRecord.blockedUntil > now) {
    logSecurityThreat(req, "UNWANTED_REPEATED_ACCESS_BLOCKED", 429, "Blocked during cooldown window");
    return res.status(429).json({
      success: false,
      message: "Security Notice: Temporary cooldown active due to repeated unexpected access from this network.",
    });
  }

  // Request counter per minute
  let record = ipRequestCounts.get(ip);
  if (!record || record.resetTime <= now) {
    record = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    ipRequestCounts.set(ip, record);
  } else {
    record.count++;
  }

  if (record.count > MAX_REQUESTS_PER_MINUTE) {
    // Flag abuse and apply cooldown
    ipFailedAttempts.set(ip, {
      count: MAX_FAILED_ATTEMPTS,
      blockedUntil: now + COOLDOWN_MS,
    });

    logSecurityThreat(
      req,
      "RATE_LIMIT_BURST_EXCEEDED",
      429,
      `Exceeded ${MAX_REQUESTS_PER_MINUTE} requests/minute (actual: ${record.count})`
    );

    return res.status(429).json({
      success: false,
      message: "Security Notice: Rate limit exceeded. Unwanted repeated access detected and logged.",
    });
  }

  next();
}

/**
 * Tracks failed authentication attempts
 */
function recordFailedAuth(req, reason = "Invalid credentials") {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const now = Date.now();
  let record = ipFailedAttempts.get(ip) || { count: 0, blockedUntil: null };
  record.count++;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + COOLDOWN_MS;
    logSecurityThreat(req, "BRUTE_FORCE_BURST_FLAGGED", 429, `Exceeded ${MAX_FAILED_ATTEMPTS} failed attempts. Cooldown applied.`);
  } else {
    logSecurityThreat(req, "AUTHENTICATION_FAILURE", 401, reason);
  }

  ipFailedAttempts.set(ip, record);
}

function clearFailedAuth(req) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  ipFailedAttempts.delete(ip);
}

module.exports = {
  logSecurityThreat,
  networkIntrusionGuard,
  recordFailedAuth,
  clearFailedAuth,
};

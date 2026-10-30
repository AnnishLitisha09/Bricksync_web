"use strict";

const jwt = require("jsonwebtoken");
const { logSecurityThreat } = require("../utils/securityLogger");
const { verifyClientSignature } = require("../utils/encryption");

// Fast in-memory user role cache: userid -> { userRole, cachedAt }
const userRoleCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute TTL

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    logSecurityThreat(req, "MISSING_AUTH_HEADER", 401, "No authorization header provided");
    return res.status(401).json({ success: false, message: "Authorization header missing" });
  }

  const parts = header.trim().split(/\s+/);
  const token = parts.length > 1 ? parts[1] : parts[0];

  if (!token) {
    logSecurityThreat(req, "MISSING_TOKEN", 401, "Token empty");
    return res.status(401).json({ success: false, message: "Token missing" });
  }

  // Verify client signature (protects cURLs from token hijacking & unauthorized replay)
  const clientSignature = req.headers["x-client-signature"];
  const clientTimestamp = req.headers["x-client-timestamp"];

  if (clientSignature && clientTimestamp) {
    const isValid = verifyClientSignature(token, clientTimestamp, clientSignature);
    if (!isValid) {
      logSecurityThreat(
        req,
        "TOKEN_SIGNATURE_MISMATCH",
        403,
        "Token utilized outside authorized client application (Signature mismatch or expired)"
      );
      return res.status(403).json({
        success: false,
        message: "Security alert: Client signature mismatch or expired. Access rejected.",
      });
    }
  } else if (
    process.env.STRICT_SIGNATURE === "true" ||
    (req.headers["user-agent"] && req.headers["user-agent"].toLowerCase().includes("curl"))
  ) {
    logSecurityThreat(
      req,
      "BLOCKED_RAW_CURL_ATTEMPT",
      403,
      "Direct raw cURL/terminal access blocked: missing client cryptographic signature"
    );
    return res.status(403).json({
      success: false,
      message: "Security alert: Direct raw cURL access prohibited without authorized client signature.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let userRole = decoded.userRole;

    // If userRole is not baked in the token, retrieve from cache or DB
    const now = Date.now();
    const cached = userRoleCache.get(decoded.userid);
    if (cached && cached.cachedAt > now - CACHE_TTL_MS) {
      userRole = cached.userRole;
    } else {
      try {
        const { User } = require("../models");
        const found = await User.findByPk(decoded.userid, {
          attributes: ["userid", "userRole", "name"],
        });
        if (found) {
          userRole = found.userRole;
          userRoleCache.set(decoded.userid, { userRole, cachedAt: now });
        }
      } catch (_) {}
    }

    req.user = {
      userid: decoded.userid,
      email: decoded.email,
      userRole: userRole !== undefined ? Number(userRole) : 3,
    };

    next();
  } catch (err) {
    logSecurityThreat(req, "INVALID_TOKEN_ATTEMPT", 403, err.message);
    return res.status(403).json({ success: false, message: "Token expired or invalid" });
  }
};

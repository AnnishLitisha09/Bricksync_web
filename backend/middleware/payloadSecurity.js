"use strict";

const { encryptPayload, decryptPayload } = require("../utils/encryption");

/**
 * Handles cross-platform payload encryption & decryption for BrickSync
 */
module.exports = (req, res, next) => {
  // 1. Decrypt incoming encrypted request body if present
  if (req.body && req.body._encrypted && typeof req.body.payload === "string") {
    const decrypted = decryptPayload(req.body.payload);
    if (decrypted !== null) {
      req.body = decrypted;
    }
  }

  // 2. Intercept res.json to automatically encrypt responses:
  // - If client explicitly requested encryption
  // - OR if request is authenticated under /api (protecting financial/operational data from cURL interception)
  const isAuthRequest = Boolean(req.headers.authorization);
  const wantsEncryption =
    req.headers["x-encrypted-transfer"] === "true" ||
    req.headers["accept-encoding-secure"] === "aes256" ||
    (isAuthRequest && !req.originalUrl.includes("/auth/login"));

  if (wantsEncryption) {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      // Don't double encrypt
      if (body && body._encrypted) {
        return originalJson(body);
      }
      // Keep HTTP error statuses (4xx, 5xx) legible for client alert handling
      if (res.statusCode >= 400) {
        return originalJson(body);
      }
      const encryptedHex = encryptPayload(body);
      return originalJson({
        success: true,
        _encrypted: true,
        payload: encryptedHex,
      });
    };
  }

  next();
};

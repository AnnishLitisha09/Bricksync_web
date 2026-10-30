"use strict";

const { logSecurityThreat } = require("../utils/securityLogger");

/**
 * Role-Based Access Control Middleware (Modeled after Tripzo role.js)
 * Usage:
 *   router.use(roleMiddleware(1)); // Admin only
 *   router.get('/my-data', roleMiddleware(1, 2), controller); // Admin & Driver
 */
module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      logSecurityThreat(req, "UNAUTHENTICATED_ACCESS_ATTEMPT", 401, "No authenticated user on role-guarded route");
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const userRole = Number(req.user.userRole ?? 3);

    // Role 1 is Admin / Super Admin — full authority across all financial & operational resources
    if (userRole === 1) {
      return next();
    }

    // Check if user's role is in the allowed list
    const isAllowed = allowedRoles.map(Number).includes(userRole);

    if (isAllowed) {
      return next();
    }

    // Role Permission Violation: Immediately log security alert
    const roleNames = { 1: "Admin", 2: "Driver", 3: "Customer" };
    const userRoleName = roleNames[userRole] || `Role-${userRole}`;
    const requiredRoles = allowedRoles.map((r) => roleNames[r] || `Role-${r}`).join(", ");

    logSecurityThreat(
      req,
      "UNAUTHORIZED_ROLE_ATTEMPT",
      403,
      `User ID ${req.user.userid} (${userRoleName}) attempted to access restricted endpoint requiring: [${requiredRoles}]`
    );

    return res.status(403).json({
      success: false,
      message: "Access denied. You do not have permission to access this resource.",
      requiredRole: requiredRoles,
    });
  };
};

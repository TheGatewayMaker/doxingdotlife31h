import { RequestHandler } from "express";
import { verifyFirebaseToken } from "../utils/firebase-admin";

/**
 * Check authentication status
 * Verifies Firebase ID token sent by client
 */
export const handleCheckAuth: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        authenticated: false,
        message: "No valid authorization header provided",
      });
      return;
    }

    const idToken = authHeader.replace("Bearer ", "");

    try {
      const verifiedToken = await verifyFirebaseToken(idToken);

      if (!verifiedToken.isAuthorized) {
        res.status(403).json({
          authenticated: false,
          message: "Email is not authorized to access this resource",
          email: verifiedToken.email,
        });
        return;
      }

      res.json({
        authenticated: true,
        message: "Token is valid and authorized",
        uid: verifiedToken.uid,
        email: verifiedToken.email,
      });
    } catch (tokenError) {
      res.status(401).json({
        authenticated: false,
        message:
          tokenError instanceof Error ? tokenError.message : "Invalid token",
      });
    }
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({ error: "Auth check failed" });
  }
};

/**
 * Logout endpoint (for cleanup on client side)
 * Firebase handles session on client, this is just for logging
 */
export const handleLogout: RequestHandler = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

/**
 * Auth middleware to protect routes
 * Verifies Firebase ID token and checks authorization
 */
export const authMiddleware: (
  req: any,
  res: any,
  next: any,
) => Promise<void> = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn(
        `[${new Date().toISOString()}] Auth attempt without valid bearer token for: ${req.method} ${req.path}`,
      );
      res.status(401).json({
        error: "No authentication token provided",
      });
      return;
    }

    const idToken = authHeader.replace("Bearer ", "");
    console.log(
      `[${new Date().toISOString()}] Attempting to verify token for: ${req.method} ${req.path}`,
    );

    try {
      const verifiedToken = await verifyFirebaseToken(idToken);

      if (!verifiedToken.isAuthorized) {
        console.warn(
          `[${new Date().toISOString()}] Unauthorized access attempt from email: ${verifiedToken.email}`,
        );
        res.status(403).json({
          error: "Email is not authorized to access this resource",
        });
        return;
      }

      // Attach user info to request for use in route handlers
      req.user = {
        uid: verifiedToken.uid,
        email: verifiedToken.email,
      };

      console.log(
        `[${new Date().toISOString()}] ✅ Authorized access: ${verifiedToken.email}`,
      );
      next();
    } catch (tokenError) {
      const errorMsg =
        tokenError instanceof Error ? tokenError.message : String(tokenError);
      console.warn(
        `[${new Date().toISOString()}] Token verification failed: ${errorMsg}`,
      );
      res.status(401).json({
        error: "Invalid or expired authentication token",
        details: process.env.NODE_ENV === "development" ? errorMsg : undefined,
      });
    }
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Auth middleware error:`,
      error,
    );
    res.status(500).json({ error: "Authentication failed" });
  }
};

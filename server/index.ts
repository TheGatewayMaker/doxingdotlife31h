import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import { handleDemo } from "./routes/demo";
import { handleUpload } from "./routes/upload";
import { handleGenerateUploadUrls } from "./routes/generate-upload-urls";
import { handleUploadMetadata } from "./routes/upload-metadata";
import { handleGetPosts } from "./routes/posts";
import { handleGetServers } from "./routes/servers";
import {
  handleDeletePost,
  handleDeleteMediaFile,
  handleUpdatePost,
} from "./routes/admin";
import {
  handleLogin,
  handleLogout,
  handleCheckAuth,
  authMiddleware,
  optionalAuthMiddleware,
} from "./routes/auth";
import { validateR2Configuration } from "./utils/r2-storage";

// VPS configuration with proper size handling
// Files are uploaded to server memory, then to R2
// 500MB total limit for all files combined (adjust if needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB per file
    files: 100, // Allow up to 100 files
  },
});

export function createServer() {
  const app = express();

  // Security headers middleware - MUST be before CORS to prevent browser blocking
  app.use((req, res, next) => {
    // Critical headers to allow large uploads without browser blocking
    // COOP: Isolates browsing context, prevents clickjacking
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    // COEP: Enables cross-origin isolation for SharedArrayBuffer
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    // CSP: Prevent inline scripts and restrict resource loading
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
    );
    // Additional security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Middleware - order matters, apply parsers first
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests from any origin (development-friendly)
        // In production, specify exact origins: ['https://example.com', 'https://app.example.com']
        callback(null, true);
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true, // Allow cookies to be sent
    }),
  );

  // Cookie parser middleware - MUST come before route handlers
  app.use(cookieParser());

  // JSON and URL-encoded body parsing with increased limits for VPS
  // Note: multipart/form-data is NOT parsed by these - it's handled by multer
  // Set limits to 500MB to allow large payloads
  app.use(express.json({ limit: "500mb" }));
  app.use(express.urlencoded({ extended: true, limit: "500mb" }));

  // Error handling for body parsing
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (err instanceof SyntaxError && "body" in err) {
        console.error("JSON parse error:", err);
        return res.status(400).json({
          error: "Invalid JSON in request body",
          details:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      }
      next(err);
    },
  );

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const originalJson = res.json;

    res.json = function (body) {
      const duration = Date.now() - start;
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`,
      );
      return originalJson.call(this, body);
    };

    next();
  });

  // Health check endpoint
  app.get("/api/health", async (_req, res) => {
    try {
      const hasFirebaseConfig = !!process.env.FIREBASE_PROJECT_ID;
      const hasAuthorizedEmails = !!process.env.VITE_AUTHORIZED_EMAILS;
      const r2Validation = await validateR2Configuration();

      res.json({
        status: r2Validation.isValid ? "ok" : "partial",
        environment: process.env.NODE_ENV || "development",
        firebaseConfigured: hasFirebaseConfig,
        authorizedEmailsConfigured: hasAuthorizedEmails,
        r2: {
          configured: r2Validation.isValid,
          message: r2Validation.message,
          details:
            process.env.NODE_ENV === "development"
              ? r2Validation.details
              : undefined,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({
        status: "error",
        environment: process.env.NODE_ENV || "development",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", handleLogout);
  app.get("/api/auth/check", handleCheckAuth);

  // Forum API routes
  // Timeout middleware for presigned URL generation and metadata storage
  // (Note: File uploads now go directly to R2, not through this endpoint)
  const uploadTimeout = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    // 30 minutes for large file uploads (supports files up to 500MB)
    // Large uploads may take significant time on slower connections
    const timeout = 30 * 60 * 1000;

    try {
      // Set socket timeouts on both request and response
      if (req.socket) {
        req.socket.setTimeout(timeout);
        // Enable TCP keep-alive to prevent connection from being idle-killed
        req.socket.setKeepAlive(true, 5000);
      }
      if (res.socket) {
        res.socket.setTimeout(timeout);
        res.socket.setKeepAlive(true, 5000);
      }

      // Add timeout error handling
      req.on("timeout", () => {
        console.error(
          `[${new Date().toISOString()}] Request timeout after ${timeout}ms`,
        );
        if (!res.headersSent) {
          res.status(408).json({
            error: "Request timeout",
            details:
              "Upload took too long. Please try again with smaller files.",
          });
        }
      });

      res.on("timeout", () => {
        console.error(
          `[${new Date().toISOString()}] Response timeout after ${timeout}ms`,
        );
        if (!res.headersSent) {
          res.status(408).json({
            error: "Response timeout",
            details: "Server response took too long. Please try again.",
          });
        }
      });
    } catch (error) {
      console.error("Error setting socket timeout:", error);
    }

    next();
  };

  // Request validation middleware for multipart uploads
  const validateUploadRequest = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const contentType = req.get("content-type") || "";

    // Validate this is a multipart form upload
    if (!contentType.includes("multipart/form-data")) {
      console.error(
        `[${new Date().toISOString()}] Invalid Content-Type for upload: ${contentType}`,
      );
      return res.status(400).json({
        error: "Invalid request format",
        details: "Content-Type must be multipart/form-data",
      });
    }

    console.log(
      `[${new Date().toISOString()}] Valid upload request: ${contentType}`,
    );
    next();
  };

  // Multer error handling middleware
  const multerErrorHandler = (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (err.name === "MulterError") {
      console.error(
        `[${new Date().toISOString()}] Multer error:`,
        err.code,
        err.message,
      );
      if (err.code === "FILE_TOO_LARGE") {
        return res.status(413).json({
          error: "File too large",
          details: `Maximum file size is 500MB per file. Received: ${(err.limit / 1024 / 1024).toFixed(2)}MB`,
        });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          error: "Too many files",
          details: `Maximum 100 files allowed per upload. ${err.message}`,
        });
      }
      if (err.code === "LIMIT_FIELD_KEY") {
        return res.status(400).json({
          error: "Field name too long",
          details: err.message,
        });
      }
      if (err.code === "LIMIT_FIELD_VALUE") {
        return res.status(400).json({
          error: "Field value too large",
          details: err.message,
        });
      }
      return res.status(400).json({
        error: "File upload error",
        details:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Failed to parse file upload",
      });
    }
    next(err);
  };

  // Catch-all async error handler wrapper - defined before routes that use it
  const asyncHandler = (
    fn: (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => Promise<any>,
  ) => {
    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  // Presigned URL generation route (for R2 direct uploads)
  app.post(
    "/api/generate-upload-urls",
    authMiddleware,
    asyncHandler(handleGenerateUploadUrls),
  );

  // Metadata storage route (after files have been uploaded to R2)
  app.post(
    "/api/upload-metadata",
    authMiddleware,
    asyncHandler(handleUploadMetadata),
  );

  app.post(
    "/api/upload",
    uploadTimeout,
    validateUploadRequest,
    (req, res, next) => {
      try {
        upload.fields([
          { name: "media", maxCount: 100 },
          { name: "thumbnail", maxCount: 1 },
        ])(req, res, (err) => {
          if (err) {
            return multerErrorHandler(err, req, res, next);
          }
          next();
        });
      } catch (error) {
        console.error("Error in upload middleware:", error);
        return multerErrorHandler(error, req, res, next);
      }
    },
    asyncHandler(handleUpload),
  );

  app.get("/api/posts", handleGetPosts);
  app.get("/api/servers", handleGetServers);

  // Admin routes (protected by auth middleware)
  app.delete("/api/posts/:postId", authMiddleware, handleDeletePost);
  app.delete(
    "/api/posts/:postId/media/:fileName",
    authMiddleware,
    handleDeleteMediaFile,
  );
  app.put("/api/posts/:postId", authMiddleware, handleUpdatePost);

  // Media proxy endpoint for additional CORS support
  app.get("/api/media/:postId/:fileName", async (req, res) => {
    try {
      const { postId, fileName } = req.params;

      if (!postId || !fileName) {
        return res.status(400).json({ error: "Invalid request" });
      }

      // Validate that only legitimate paths are accessed
      if (
        fileName.includes("..") ||
        fileName.includes("/") ||
        fileName.includes("\\")
      ) {
        return res.status(403).json({ error: "Invalid file path" });
      }

      // Construct media URL safely
      let baseUrl: string;
      if (process.env.R2_PUBLIC_URL) {
        baseUrl = process.env.R2_PUBLIC_URL;
      } else if (process.env.R2_BUCKET_NAME && process.env.R2_ACCOUNT_ID) {
        baseUrl = `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      } else {
        return res.status(500).json({ error: "R2 configuration is missing" });
      }

      const mediaUrl = `${baseUrl}/posts/${postId}/${fileName}`;

      res.set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=31536000",
      });

      const response = await fetch(mediaUrl);
      const contentType = response.headers.get("content-type");

      if (contentType) {
        res.set("Content-Type", contentType);
      }

      res.set({
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=31536000",
      });

      if (response.ok && response.body) {
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(new Uint8Array(buffer)));
      } else {
        res
          .status(response.status || 500)
          .json({ error: "Failed to fetch media" });
      }
    } catch (err) {
      console.error("Media proxy error:", err);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  // Global error handler middleware - MUST be last
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error("Unhandled error:", err);

      // Prevent sending response twice
      if (res.headersSent) {
        console.error("Headers already sent, cannot send error response");
        return;
      }

      // Set Content-Type to JSON to ensure proper response format
      res.set("Content-Type", "application/json");

      const status =
        err.status ||
        err.statusCode ||
        (err.name === "MulterError" ? 400 : 500);
      const message = err.message || "An unexpected error occurred";
      const details =
        process.env.NODE_ENV === "development"
          ? {
              message: err.message,
              stack: err.stack,
              errorName: err.name,
            }
          : undefined;

      res.status(status).json({
        error: message,
        ...(details && { details }),
      });
    },
  );

  return app;
}

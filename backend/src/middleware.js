const jwt = require("jsonwebtoken");
const { ZodError } = require("zod");
const { config } = require("./config");
const { prisma } = require("./db");
const logger = require("./logger");

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    logger.warn("Authentication failed: missing token");
    return res.status(401).json({ message: "Missing authentication token." });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managerId: true,
        passwordSetupRequired: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      logger.warn("Authentication failed: user not found id=%s", payload.sub);
      return res.status(401).json({ message: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn("Authentication failed: %s", error.message);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have access to this action." });
    }

    next();
  };
}

function notFound(_req, res) {
  logger.warn("Route not found: %s %s", _req.method, _req.originalUrl);
  res.status(404).json({ message: "Route not found." });
}

function errorHandler(error, req, res, _next) {
  if (error instanceof ZodError) {
    logger.warn("Validation failed on %s %s: %o", req.method, req.originalUrl, error.issues);
    return res.status(400).json({
      message: "Validation failed.",
      issues: error.issues,
    });
  }

  logger.error("Unhandled error on %s %s: %o", req.method, req.originalUrl, error);
  return res.status(error.statusCode || 500).json({
    message: error.message || "Something went wrong.",
  });
}

module.exports = {
  authenticate,
  authorize,
  notFound,
  errorHandler,
};

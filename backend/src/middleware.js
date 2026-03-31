const jwt = require("jsonwebtoken");
const { Prisma } = require("@prisma/client");
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

function handlePrismaError(error, req) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : String(error.meta?.target || "");
      logger.warn("Unique constraint failed on %s %s for fields: %s", req.method, req.originalUrl, target);

      if (/email/i.test(target)) {
        return {
          statusCode: 409,
          message: "An account with this email already exists.",
        };
      }

      return {
        statusCode: 409,
        message: "A record with these details already exists.",
      };
    }

    if (error.code === "P2003") {
      const field = String(error.meta?.field_name || "");
      logger.warn("Foreign key constraint failed on %s %s for field: %s", req.method, req.originalUrl, field);

      if (/manager/i.test(field)) {
        return {
          statusCode: 400,
          message: "The selected manager is invalid or no longer exists.",
        };
      }

      if (/assignee/i.test(field)) {
        return {
          statusCode: 400,
          message: "The selected assignee is invalid or no longer exists.",
        };
      }

      if (/task/i.test(field)) {
        return {
          statusCode: 404,
          message: "The related task was not found.",
        };
      }

      if (/user/i.test(field)) {
        return {
          statusCode: 404,
          message: "The related user was not found.",
        };
      }

      return {
        statusCode: 400,
        message: "This action references a related record that does not exist anymore.",
      };
    }

    if (error.code === "P2000") {
      logger.warn("Value too long on %s %s", req.method, req.originalUrl);
      return {
        statusCode: 400,
        message: "One of the provided values is too long.",
      };
    }

    if (error.code === "P2011") {
      logger.warn("Missing required database value on %s %s", req.method, req.originalUrl);
      return {
        statusCode: 400,
        message: "A required value is missing.",
      };
    }

    if (error.code === "P2025") {
      logger.warn("Database record not found on %s %s", req.method, req.originalUrl);
      return {
        statusCode: 404,
        message: "The requested record was not found.",
      };
    }

    if (error.code === "P2022") {
      logger.error("Database schema is out of date on %s %s: %o", req.method, req.originalUrl, error.meta);
      return {
        statusCode: 500,
        message: "Database schema is out of date. Run the latest Prisma migrations in production.",
      };
    }
  }

  return null;
}

function errorHandler(error, req, res, _next) {
  if (error instanceof ZodError) {
    logger.warn("Validation failed on %s %s: %o", req.method, req.originalUrl, error.issues);
    return res.status(400).json({
      message: "Validation failed.",
      issues: error.issues,
    });
  }

  const prismaError = handlePrismaError(error, req);
  if (prismaError) {
    return res.status(prismaError.statusCode).json({
      message: prismaError.message,
    });
  }

  if (error.statusCode && error.statusCode < 500) {
    logger.warn("Handled application error on %s %s: %s", req.method, req.originalUrl, error.message);
  } else {
    logger.error("Unhandled error on %s %s: %o", req.method, req.originalUrl, error);
  }

  return res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Something went wrong.",
  });
}

module.exports = {
  authenticate,
  authorize,
  notFound,
  errorHandler,
};

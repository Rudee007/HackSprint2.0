const { createLogger, format, transports } = require("winston");

const logger = createLogger({
  level: "info", // default log level
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }), // include stack trace in errors
    format.splat(),
    format.json()
  ),
  transports: [
    // Show logs in console (useful for dev)
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, ...meta }) => {
          return `[${timestamp}] ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ""
          }`;
        })
      )
    }),

    // Save error logs in a file
    new transports.File({ filename: "logs/error.log", level: "error" }),

    // Save all logs in a combined file
    new transports.File({ filename: "logs/combined.log" })
  ],
});

// In production, log only warnings & errors to console
if (process.env.NODE_ENV === "production") {
  logger.transports[0].level = "warn";
}

module.exports = logger;

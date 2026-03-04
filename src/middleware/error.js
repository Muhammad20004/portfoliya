export function notFound(req, res, next) {
  res.status(404).json({ message: "Not Found" });
}

export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || "Server Error";

  const details =
    process.env.NODE_ENV === "development"
      ? err.stack
      : undefined;

  res.status(status).json({
    message,
    details,
  });
}

export default function errorHandler(error, req, res, next) {
  // JWT 관련 에러 처리
  if (error.name === "UnauthorizedError") {
    return res.status(401).json({ message: "invalid token..." });
  }

  // multer 관련 에러 처리
  if (error.name === "MulterError") {
    return res.status(400).json({
      message: error.message,
      code: error.code,
    });
  }

  const status =
    typeof error.code === "number" && error.code >= 100 && error.code < 600
      ? error.code
      : 500;

  console.error(error);
  return res.status(status).json({
    path: req.path,
    method: req.method,
    message: error.message ?? "Internal Server Error",
    data: error.data ?? undefined,
    date: new Date(),
  });
}

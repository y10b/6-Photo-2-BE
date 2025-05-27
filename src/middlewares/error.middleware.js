export default function errorHandler(error, req, res, next) {
  // ✅ JWT 관련 에러 처리
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({message: 'invalid token...'});
  }

  // ✅ multer 관련 에러 처리 (추후 파일 업로드 시 사용)
  if (error.name === 'MulterError') {
    return res.status(400).json({
      message: error.message,
      code: error.code,
    });
  }

  // ✅ 기본 에러 처리 (error.code 사용)
  const status = error.code ?? 500;

  console.error(error);
  return res.status(status).json({
    path: req.path,
    method: req.method,
    message: error.message ?? 'Internal Server Error',
    data: error.data ?? undefined,
    date: new Date(),
  });
}

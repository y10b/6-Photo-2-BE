import express from 'express';
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({message: '파일이 없습니다.'});
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({
    message: '파일 업로드 완료',
    imageUrl,
  });
});

export default router;

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadFolder = 'uploads';

// 저장 방법 설정
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, uploadFolder);
  },

  // 저장할 파일 설정
  filename: function (req, file, callback) {
    const ext = path.extname(file.originalname); // 확장자
    const baseName = path.basename(file.originalname, ext); // 확장자 뺀 파일명
    const newFileName = `${baseName}-${Date.now()}${ext}`;
    callback(null, newFileName);
  },
});

// multer 설정
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export default upload;

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {v4 as uuidv4} from 'uuid';

const uploadFolder = 'uploads';

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, {recursive: true});
}

// 저장 방법 설정
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, uploadFolder);
  },

  // 저장할 파일 설정
  filename: function (req, file, callback) {
    const ext = path.extname(file.originalname);
    const safeFileName = `${uuidv4()}-${Date.now()}${ext}`;
    callback(null, safeFileName);
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

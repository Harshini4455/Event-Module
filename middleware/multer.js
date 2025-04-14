const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'image/jpeg', 
        'image/png', 
        'image/gif',
        'video/mp4',
        'video/quicktime'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'), false);
      }
    }
  });

module.exports = upload;
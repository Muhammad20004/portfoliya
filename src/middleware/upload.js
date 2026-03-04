import multer from "multer";

const memoryStorage = multer.memoryStorage();

const avatarUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Avatar must be an image"));
    }
    cb(null, true);
  },
});

const projectUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB per file
});

export { avatarUpload, projectUpload };

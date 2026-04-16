import { randomBytes } from "crypto";
import multer from "multer";
import path from "path";

const ALLOWED_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads")); // absolute path
  },
  filename: (req, file, cb) => {
    const uniqueName = randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase(); // .jpg, .png etc
    cb(null, uniqueName + ext);
  },
});

export const imageUpload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ALLOWED_TYPES[file.mimetype];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions?.includes(ext)) {
      return cb(new Error(`File type not allowed: ${file.originalname}`));
    }

    cb(null, true);
  },
});

// export const csvUpload = multer({
//   dest: "uploads/",
//   limits: { fileSize: 1024 * 1024 * 5 },
//   fileFilter: (request, file, cb) => {
//     if (
//       file.mimetype !== "text/csv" ||
//       path.extname(file.originalname).toLowerCase() !== ".csv"
//     ) {
//       return cb(null, false);
//     }
//     cb(null, true);
//   },
// });

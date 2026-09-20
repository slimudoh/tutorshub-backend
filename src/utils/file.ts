import { randomBytes } from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configurable so you can point it at a persistent disk on Render
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

// Create it once when the module loads
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueName = randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase();
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

export const csvUpload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: (request, file, cb) => {
    if (
      file.mimetype !== "text/csv" ||
      path.extname(file.originalname).toLowerCase() !== ".csv"
    ) {
      return cb(null, false);
    }
    cb(null, true);
  },
});

export const deleteFile = async (filename: string) => {
  // basename prevents "../" path traversal
  const filePath = path.join(UPLOAD_DIR, path.basename(filename));
  try {
    await fs.promises.unlink(filePath);
  } catch (err: any) {
    if (err.code !== "ENOENT") throw err;
  }
};

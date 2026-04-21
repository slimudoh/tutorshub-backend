"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageUpload = void 0;
const crypto_1 = require("crypto");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const ALLOWED_TYPES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "application/pdf": [".pdf"],
};
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, "../../uploads")); // absolute path
    },
    filename: (req, file, cb) => {
        const uniqueName = (0, crypto_1.randomBytes)(16).toString("hex");
        const ext = path_1.default.extname(file.originalname).toLowerCase(); // .jpg, .png etc
        cb(null, uniqueName + ext);
    },
});
exports.imageUpload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ALLOWED_TYPES[file.mimetype];
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        if (!(allowedExtensions === null || allowedExtensions === void 0 ? void 0 : allowedExtensions.includes(ext))) {
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

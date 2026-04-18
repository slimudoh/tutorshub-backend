"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const constant_1 = require("../utils/constant");
const nodemailer_express_handlebars_1 = __importDefault(require("nodemailer-express-handlebars"));
const path_1 = __importDefault(require("path"));
const handlebarOptions = {
    viewEngine: {
        extName: ".hbs",
        partialsDir: path_1.default.join(__dirname, "../views/"),
        layoutsDir: path_1.default.join(__dirname, "../views/"),
        defaultLayout: "",
    },
    viewPath: path_1.default.join(__dirname, "../views/"),
    extName: ".hbs",
};
const transporter = nodemailer_1.default.createTransport({
    name: constant_1.MAIL_CONFIG.host,
    host: constant_1.MAIL_CONFIG.host,
    port: 465,
    secure: true,
    logger: true,
    debug: true,
    auth: {
        user: constant_1.MAIL_CONFIG.email,
        pass: constant_1.MAIL_CONFIG.password,
    },
    tls: {
        rejectUnauthorized: false,
        ciphers: "SSLv3",
    },
});
transporter.use("compile", (0, nodemailer_express_handlebars_1.default)(handlebarOptions));
exports.default = transporter;

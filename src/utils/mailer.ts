import nodemailer from "nodemailer";
import { MAIL_CONFIG } from "../utils/constant";
import hbs from "nodemailer-express-handlebars";
import path from "path";

const handlebarOptions = {
  viewEngine: {
    extName: ".hbs",
    partialsDir: path.join(__dirname, "../views/"),
    layoutsDir: path.join(__dirname, "../views/"),
    defaultLayout: "",
  },
  viewPath: path.join(__dirname, "../views/"),
  extName: ".hbs",
};

const transporter = nodemailer.createTransport({
  name: MAIL_CONFIG.host,
  host: MAIL_CONFIG.host,
  port: 465,
  secure: true,
  logger: true,
  debug: true,
  auth: {
    user: MAIL_CONFIG.email,
    pass: MAIL_CONFIG.password,
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: "SSLv3",
  },
});

transporter.use("compile", hbs(handlebarOptions));

export default transporter;

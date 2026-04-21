"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let DB_NAME = "tutorshub";
let DB_USER = "root";
let DB_PASS = "Obalende3783*";
let DB_HOST = "localhost";
let DB_PORT = 3306;
console.log("env", process.env.NODE_ENV);
// if (process.env.NODE_ENV === "production") {
//   DB_NAME = "flywwjyj_choice-pots";
//   DB_USER = "flywwjyj";
//   DB_PASS = "bnWyQ5bX1sgF";
// }
const sequelize = new sequelize_1.Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    port: Number(DB_PORT),
    dialect: "mysql",
    logging: false,
});
exports.default = sequelize;

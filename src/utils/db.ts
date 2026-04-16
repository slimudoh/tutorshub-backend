import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

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

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: "mysql",
  logging: false,
});

export default sequelize;

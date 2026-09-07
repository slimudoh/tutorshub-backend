import { Sequelize } from "sequelize";
import fs from "fs";
import path from "path";

console.log("env", process.env.NODE_ENV);

const isProduction = process.env.NODE_ENV === "production";

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",
    logging: false,
    ...(isProduction && {
      dialectOptions: {
        ssl: {
          rejectUnauthorized: true,
          ca: fs.readFileSync(path.join(__dirname, "../ca.pem")).toString(),
        },
      },
    }),
  },
);

export default sequelize;

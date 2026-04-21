"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = __importDefault(require("../utils/db"));
class Currency extends sequelize_1.Model {
}
Currency.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
    country: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    currency: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    symbol: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    amount: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: "currencies",
    sequelize: db_1.default,
});
exports.default = Currency;

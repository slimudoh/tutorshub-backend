"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = __importDefault(require("../utils/db"));
class BlackListToken extends sequelize_1.Model {
}
BlackListToken.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
    token: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: "blackListTokens",
    sequelize: db_1.default,
});
exports.default = BlackListToken;

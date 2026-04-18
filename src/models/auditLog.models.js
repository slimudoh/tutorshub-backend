"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = __importDefault(require("../utils/db"));
class AuditLog extends sequelize_1.Model {
}
AuditLog.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
    user: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    action: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    oldData: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    newData: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    section: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: "auditLogs",
    sequelize: db_1.default,
});
exports.default = AuditLog;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = __importDefault(require("../utils/db"));
class Review extends sequelize_1.Model {
}
Review.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    lessonId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
    },
    rating: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    comment: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
}, {
    tableName: "reviews",
    sequelize: db_1.default,
});
exports.default = Review;

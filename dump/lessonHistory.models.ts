// import { DataTypes, Model } from "sequelize";
// import sequelize from "../src/utils/db";

// class LessonHistory extends Model {
//   declare id: string | null;
//   declare userId: string | null;
//   declare title: string | null;
//   declare level: string | null;
//   declare category: string | null;
//   declare language: string | null;
//   declare duration: string | null;
//   declare startDate: Date | null;
//   declare endDate: Date | null;
//   declare status: string | null;
//   declare createdAt: Date;
//   declare updatedAt: Date;
// }

// LessonHistory.init(
//   {
//     id: {
//       type: DataTypes.UUID,
//       allowNull: false,
//       primaryKey: true,
//     },
//     userId: {
//       type: DataTypes.UUID,
//       allowNull: true,
//     },
//     title: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//     },
//     level: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     status: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     category: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     language: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     duration: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     startDate: {
//       type: DataTypes.DATE,
//       allowNull: true,
//     },
//     endDate: {
//       type: DataTypes.DATE,
//       allowNull: true,
//     },
//   },
//   {
//     tableName: "lessonHistories",
//     sequelize,
//   },
// );

// export default LessonHistory;

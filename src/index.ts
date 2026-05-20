import express from "express";
import dotenv from "dotenv";
import sequelize from "./utils/db";
import { json } from "body-parser";
import cors from "cors";
import {
  invalidRouteHandler,
  errorHandler,
} from "./middlewares/error.middlewares";
import path from "path";
import rateLimit from "express-rate-limit";

import userRouter from "./routes/user.routes";
import authRouter from "./routes/auth.routes";
import overviewRouter from "./routes/overview.routes";
import auditLogsRouter from "./routes/auditLogs.routes";
import lessonRouter from "./routes/lesson.routes";
import settingsRouter from "./routes/settings.routes";
import notificationRouter from "./routes/notification.routes";
import transactionRouter from "./routes/transaction.routes";
import wishlistRouter from "./routes/wishlist.routes";
import pricingRouter from "./routes/pricing.routes";
import currencyRouter from "./routes/currencies.routes";
import enrolleeRouter from "./routes/enrollee.routes";
import reviewRouter from "./routes/review.routes";
import reportRouter from "./routes/report.routes";
import newsletterRouter from "./routes/newsletter.routes";
import categoryRouter from "./routes/category.routes";
import messageRouter from "./routes/message.routes";
import jobRouter from "./routes/job.routes";
import instructorRouter from "./routes/instructor.routes";

import User from "./models/user.models";
import BlackListToken from "./models/blackListToken.models";
import AuditLog from "./models/auditLog.models";
import Lesson from "./models/lesson.models";
import LessonHistory from "./models/lessonHistory.models";
import Setting from "./models/setting.models";
import DeletedAccount from "./models/deletedAccount.models";
import Notification from "./models/notification.models";
import Transaction from "./models/transaction.models";
import WishList from "./models/wishlist.models";
import SubscriptionPlan from "./models/subscriptionPlan.models";
import PricingPlan from "./models/pricingPlan.models";
import Currency from "./models/currency.models";
import Rate from "./models/rate.models";
import Review from "./models/review.models";
import LessonEnrollment from "./models/lessonEnrollment.models";
import Report from "./models/report.models";
import Newsletter from "./models/newsletter.models";
import Category from "./models/category.models";
import Message from "./models/message.models";
import InstructorEarning from "./models/instructorEarning.models";
import Instructor from "./models/instructor.models";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 8088;

const apiLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 min window
  max: 100, // 100 requests per IP
  standardHeaders: true, // RateLimit-* headers
  legacyHeaders: false,
  message: {
    error: "Too many requests, slow down.",
  },
});

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

if (process.env.NODE_ENV !== "production") {
  app.use((request, response, next) => {
    const fullUrl = `${request.protocol}://${request.get("host")}${request.originalUrl}`;
    console.log("Incoming request from", fullUrl);
    next();
  });
}

app.use(express.static(path.join(__dirname, "images")));
app.use(json());
app.use(cors(corsOptions));

app.set("trust proxy", 1);
app.use("/api/v1", apiLimiter);
app.use("/api/v1/jobs", jobRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/overview", overviewRouter);
app.use("/api/v1/audit-logs", auditLogsRouter);
app.use("/api/v1/lessons", lessonRouter);
app.use("/api/v1/settings", settingsRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/pricing", pricingRouter);
app.use("/api/v1/currencies", currencyRouter);
app.use("/api/v1/enrollees", enrolleeRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/reports", reportRouter);
app.use("/api/v1/newsletters", newsletterRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/instructors", instructorRouter);

app.use(invalidRouteHandler);
app.use(errorHandler);

sequelize
  .authenticate()
  .then(() => {
    console.log("Connected successfully.");

    User.sync();
    BlackListToken.sync({ alter: true });
    AuditLog.sync({ alter: true });
    Setting.sync({ alter: true });
    Lesson.sync({ alter: true });
    LessonHistory.sync({ alter: true });
    DeletedAccount.sync({ alter: true });
    Notification.sync({ alter: true });
    Transaction.sync({ alter: true });
    WishList.sync({ alter: true });
    SubscriptionPlan.sync({ alter: true });
    PricingPlan.sync({ alter: true });
    Currency.sync({ alter: true });
    Rate.sync({ alter: true });
    Review.sync({ alter: true });
    LessonEnrollment.sync({ alter: true });
    Report.sync({ alter: true });
    Newsletter.sync({ alter: true });
    Category.sync({ alter: true });
    Message.sync({ alter: true });
    InstructorEarning.sync({ alter: true });
    Instructor.sync({ alter: true });

    app.listen(PORT, () => {
      console.log(
        `App running in ${
          process.env.NODE_ENV ?? "development"
        } mode on port ${PORT}`,
      );
    });
  })
  .catch((error) => {
    console.error("Unable to connect to the database: ", error);
  });

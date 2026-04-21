"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./utils/db"));
const body_parser_1 = require("body-parser");
const cors_1 = __importDefault(require("cors"));
const error_middlewares_1 = require("./middlewares/error.middlewares");
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const overview_routes_1 = __importDefault(require("./routes/overview.routes"));
const auditLogs_routes_1 = __importDefault(require("./routes/auditLogs.routes"));
const lesson_routes_1 = __importDefault(require("./routes/lesson.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const wishlist_routes_1 = __importDefault(require("./routes/wishlist.routes"));
const pricing_routes_1 = __importDefault(require("./routes/pricing.routes"));
const currencies_routes_1 = __importDefault(require("./routes/currencies.routes"));
const subscriber_routes_1 = __importDefault(require("./routes/subscriber.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const user_models_1 = __importDefault(require("./models/user.models"));
const blackListToken_models_1 = __importDefault(require("./models/blackListToken.models"));
const auditLog_models_1 = __importDefault(require("./models/auditLog.models"));
const lesson_models_1 = __importDefault(require("./models/lesson.models"));
const lessonHistory_models_1 = __importDefault(require("./models/lessonHistory.models"));
const setting_models_1 = __importDefault(require("./models/setting.models"));
const deletedAccount_models_1 = __importDefault(require("./models/deletedAccount.models"));
const message_models_1 = __importDefault(require("./models/message.models"));
const transaction_models_1 = __importDefault(require("./models/transaction.models"));
const wishlist_models_1 = __importDefault(require("./models/wishlist.models"));
const subscriptionPlan_models_1 = __importDefault(require("./models/subscriptionPlan.models"));
const pricingPlan_models_1 = __importDefault(require("./models/pricingPlan.models"));
const currency_models_1 = __importDefault(require("./models/currency.models"));
const Rate_models_1 = __importDefault(require("./models/Rate.models"));
const subscriber_models_1 = __importDefault(require("./models/subscriber.models"));
const review_models_1 = __importDefault(require("./models/review.models"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 8088;
const apiLimiter = (0, express_rate_limit_1.default)({
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
app.use(express_1.default.static(path_1.default.join(__dirname, "images")));
app.use((0, body_parser_1.json)());
app.use((0, cors_1.default)(corsOptions));
app.set("trust proxy", 1);
app.use("/api/v1", apiLimiter);
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/users", user_routes_1.default);
app.use("/api/v1/overview", overview_routes_1.default);
app.use("/api/v1/audit-logs", auditLogs_routes_1.default);
app.use("/api/v1/lessons", lesson_routes_1.default);
app.use("/api/v1/settings", settings_routes_1.default);
app.use("/api/v1/messages", message_routes_1.default);
app.use("/api/v1/transactions", transaction_routes_1.default);
app.use("/api/v1/wishlist", wishlist_routes_1.default);
app.use("/api/v1/pricing", pricing_routes_1.default);
app.use("/api/v1/currencies", currencies_routes_1.default);
app.use("/api/v1/subscribers", subscriber_routes_1.default);
app.use("/api/v1/reviews", review_routes_1.default);
app.use(error_middlewares_1.invalidRouteHandler);
app.use(error_middlewares_1.errorHandler);
db_1.default
    .authenticate()
    .then(() => {
    console.log("Connected successfully.");
    user_models_1.default.sync();
    blackListToken_models_1.default.sync({ alter: true });
    auditLog_models_1.default.sync({ alter: true });
    setting_models_1.default.sync({ alter: true });
    lesson_models_1.default.sync({ alter: true });
    lessonHistory_models_1.default.sync({ alter: true });
    deletedAccount_models_1.default.sync({ alter: true });
    message_models_1.default.sync({ alter: true });
    transaction_models_1.default.sync({ alter: true });
    wishlist_models_1.default.sync({ alter: true });
    subscriptionPlan_models_1.default.sync({ alter: true });
    pricingPlan_models_1.default.sync({ alter: true });
    currency_models_1.default.sync({ alter: true });
    Rate_models_1.default.sync({ alter: true });
    subscriber_models_1.default.sync({ alter: true });
    review_models_1.default.sync({ alter: true });
    app.listen(PORT, () => {
        var _a;
        console.log(`App running in ${(_a = process.env.NODE_ENV) !== null && _a !== void 0 ? _a : "development"} mode on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error("Unable to connect to the database: ", error);
});

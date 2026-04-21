"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.invalidRouteHandler = void 0;
const invalidRouteHandler = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    const error = new Error(`Route ${request.baseUrl + request.path} not found. Please try again or contact support if the problem persists.`);
    error.statusCode = 404;
    next(error);
});
exports.invalidRouteHandler = invalidRouteHandler;
const errorHandler = (error, request, response, next) => {
    var _a;
    console.log({ error });
    let newError = error === null || error === void 0 ? void 0 : error.message;
    const statusCode = (_a = error === null || error === void 0 ? void 0 : error.statusCode) !== null && _a !== void 0 ? _a : 500;
    const message = newError !== null && newError !== void 0 ? newError : "We are currently experiencing some issues. Please try again or contact support if the problem persists.";
    response.status(statusCode).json({ message });
};
exports.errorHandler = errorHandler;

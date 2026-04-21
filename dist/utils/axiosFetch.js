"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const axiosInstance = axios_1.default.create({
    baseURL: process.env.REACT_APP_BASEURL,
});
axiosInstance.interceptors.request.use(function (config) {
    console.log("Making request to " + config.url);
    return config;
}, function (error) {
    var _a, _b;
    return Promise.reject((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message);
});
axiosInstance.interceptors.response.use(function (response) {
    return response;
}, function (error) {
    var _a, _b, _c, _d;
    console.log("error", (_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message);
    return Promise.reject((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message);
});
exports.default = axiosInstance;

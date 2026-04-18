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
exports.getUserSubcribers = exports.getAllSubcribers = void 0;
const error_services_1 = require("../services/error.services");
const subscriber_services_1 = require("../services/subscriber.services");
const getAllSubcribers = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword, pageNumber, pageSize, status } = request.query;
        const newPageNumber = Number(pageNumber);
        const newPageSize = Number(pageSize);
        const offsetSize = (newPageNumber - 1) * newPageSize;
        const subcribers = yield (0, subscriber_services_1.getAdminSubscribers)(keyword, status, offsetSize, newPageSize);
        const totalPages = yield (0, subscriber_services_1.getAdminSubscribers)(keyword, status);
        response.status(201).json({
            currentPage: newPageNumber,
            pageSize: newPageSize,
            totalRecords: totalPages,
            totalPages: typeof totalPages === "number"
                ? Math.ceil(totalPages / newPageSize)
                : 0,
            data: subcribers,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getAllSubcribers = getAllSubcribers;
const getUserSubcribers = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { keyword, pageNumber, pageSize, status } = request.query;
        const newPageNumber = Number(pageNumber);
        const newPageSize = Number(pageSize);
        const offsetSize = (newPageNumber - 1) * newPageSize;
        const userId = request.user.id;
        const subcribers = yield (0, subscriber_services_1.getSubscribers)(userId, keyword, status, offsetSize, newPageSize);
        const totalPages = yield (0, subscriber_services_1.getSubscribers)(userId, keyword, status);
        response.status(201).json({
            currentPage: newPageNumber,
            pageSize: newPageSize,
            totalRecords: totalPages,
            totalPages: typeof totalPages === "number"
                ? Math.ceil(totalPages / newPageSize)
                : 0,
            data: subcribers,
        });
    }
    catch (err) {
        const error = (0, error_services_1.createServerError)(err, 500);
        next(error);
    }
});
exports.getUserSubcribers = getUserSubcribers;

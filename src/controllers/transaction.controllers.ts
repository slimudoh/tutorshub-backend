import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError } from "../services/error.services";
import {
  getUserTransactions,
  getTransactionById,
  getTransactions,
} from "../services/transaction.services";
import { Users } from "../interfaces/user";
import { JwtPayload } from "jsonwebtoken";
import { TRANSACTION_TYPE } from "../utils/constant";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const getPayments: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { keyword, pageNumber, pageSize, status } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const transactions = await getUserTransactions(
      userId,
      TRANSACTION_TYPE.PAYMENT,
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getUserTransactions(
      userId,
      TRANSACTION_TYPE.PAYMENT,
      keyword as string,
      status as string,
    );

    response.status(201).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords: totalPages,
      totalPages:
        typeof totalPages === "number"
          ? Math.ceil(totalPages / newPageSize)
          : 0,
      data: transactions,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getEarnings: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { keyword, pageNumber, pageSize, status } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const transactions = await getUserTransactions(
      userId,
      TRANSACTION_TYPE.EARNING,
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getUserTransactions(
      userId,
      TRANSACTION_TYPE.EARNING,
      keyword as string,
      status as string,
    );

    response.status(201).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords: totalPages,
      totalPages:
        typeof totalPages === "number"
          ? Math.ceil(totalPages / newPageSize)
          : 0,
      data: transactions,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getPayouts: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { keyword, pageNumber, pageSize, status } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const transactions = await getUserTransactions(
      userId,
      TRANSACTION_TYPE.PAYOUT,
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getUserTransactions(
      userId,
      TRANSACTION_TYPE.PAYOUT,
      keyword as string,
      status as string,
    );

    response.status(201).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords: totalPages,
      totalPages:
        typeof totalPages === "number"
          ? Math.ceil(totalPages / newPageSize)
          : 0,
      data: transactions,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getAllTransactions: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { keyword, pageNumber, pageSize, status } = request.query;
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const transactions = await getTransactions(
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await getTransactions(
      keyword as string,
      status as string,
    );

    response.status(201).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords: totalPages,
      totalPages:
        typeof totalPages === "number"
          ? Math.ceil(totalPages / newPageSize)
          : 0,
      data: transactions,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getTransactionDetails: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;
    const { id } = request.params;

    const transaction = await getTransactionById(
      userId,
      TRANSACTION_TYPE.PAYMENT,
      id,
    );

    response.status(201).json({
      data: transaction,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

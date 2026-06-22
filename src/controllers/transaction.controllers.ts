import { RequestHandler, Request, Response, NextFunction } from "express";
import { createServerError, makeError } from "../services/error.services";
import {
  getUserTransactions,
  getTransactionById,
  getTransactions,
  getTransactionByReference,
  createTransaction,
} from "../services/transaction.services";
import { Users } from "../interfaces/user";
import { JwtPayload } from "jsonwebtoken";
import {
  PRICING,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from "../utils/constant";
import { findUserById } from "../services/user.services";
import {
  createUserSubscription,
  findAllPricingPlans,
  findUsersSubscriptionPlans,
} from "../services/pricing.services";
import SubscriptionPlan from "../models/subscriptionPlan.models";
import { createNotification } from "../services/notification.services";
import { createBulkAuditLogs } from "../services/auditLog.services";
import { getUserCurrency } from "../services/currency.services";
import { paginationHelper } from "../utils/formatter";

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
    const userCurrency = await getUserCurrency(request);

    const { keyword, pageNumber, pageSize, status } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [transactions, totalRecords] = await Promise.all([
      getUserTransactions(
        userId,
        TRANSACTION_TYPE.PAYMENT,
        keyword as string,
        status as string,
        offsetSize,
        newPageSize,
        userCurrency,
      ),
      getUserTransactions(
        userId,
        TRANSACTION_TYPE.PAYMENT,
        keyword as string,
        status as string,
      ) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
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
    const userCurrency = await getUserCurrency(request);

    const { keyword, pageNumber, pageSize, status } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [transactions, totalRecords] = await Promise.all([
      getUserTransactions(
        userId,
        TRANSACTION_TYPE.EARNING,
        keyword as string,
        status as string,
        offsetSize,
        newPageSize,
        userCurrency,
      ),
      getUserTransactions(
        userId,
        TRANSACTION_TYPE.EARNING,
        keyword as string,
        status as string,
      ) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
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
    const userCurrency = await getUserCurrency(request);

    const { keyword, pageNumber, pageSize, status } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [transactions, totalRecords] = await Promise.all([
      getUserTransactions(
        userId,
        TRANSACTION_TYPE.PAYOUT,
        keyword as string,
        status as string,
        offsetSize,
        newPageSize,
        userCurrency,
      ),
      getUserTransactions(
        userId,
        TRANSACTION_TYPE.PAYOUT,
        keyword as string,
        status as string,
      ) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
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
    const userCurrency = await getUserCurrency(request);

    const { keyword, pageNumber, pageSize, status } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [transactions, totalRecords] = await Promise.all([
      getTransactions(
        keyword as string,
        status as string,
        offsetSize,
        newPageSize,
        userCurrency,
      ),
      getTransactions(keyword as string, status as string) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
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

    if (!transaction) {
      return next(makeError("Transaction not found.", 404));
    }

    response.status(200).json({
      data: transaction,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const changePricingPlan: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { planId, reference, autoRenew } = request.body;
    const userId = (request as CustomRequest).user?.id;

    const [user, subscriptionPlans, plans] = await Promise.all([
      findUserById(userId),
      findUsersSubscriptionPlans(userId),
      findAllPricingPlans(true, false),
    ]);

    if (!user) {
      return next(makeError("User not found. Please try again later.", 404));
    }

    subscriptionPlans.forEach((sub: SubscriptionPlan) => {
      if (sub.planId !== null) {
        sub.plan = plans.find((p) => p.id === sub.planId) ?? null;
      }
    });

    const activeSubscription = subscriptionPlans.find(
      (sub) => sub.status !== "CANCELED",
    );

    if (activeSubscription) {
      return next(
        makeError(
          `You have an active subscription to ${activeSubscription.plan?.title} plan. Please cancel it before changing your plan.`,
          400,
        ),
      );
    }

    const plan = plans.find(
      (p) => p.id === planId && p.status === PRICING.ACTIVE,
    );

    if (!plan?.currency || !plan?.amount) {
      return next(makeError("Plan not found. Please try again later.", 404));
    }

    const existingTransaction = await getTransactionByReference(reference);
    if (existingTransaction) {
      return next(makeError("Transaction already exists.", 409));
    }

    const [transaction, newSubscriptionPlan] = await Promise.all([
      createTransaction({
        userId,
        transactionType: TRANSACTION_TYPE.PAYMENT,
        reference,
        currency: plan.currency,
        amount: plan.amount,
        status: TRANSACTION_STATUS.SUCCESSFUL,
        channel: "manual",
        purpose: `Subscription Payment for ${plan.title} plan`,
      }),
      createUserSubscription(user, plan, autoRenew),
    ]);

    await Promise.all([
      createNotification(
        "Your payment was successful",
        `Your payment was successfully processed and subscription plan changed to ${plan.title}.`,
        userId,
      ),
      createBulkAuditLogs([
        {
          user: JSON.stringify(user),
          action: "PAYMENT",
          newData: JSON.stringify(transaction),
          section: "TRANSACTION",
        },
        {
          user: JSON.stringify(user),
          action: "CHANGE SUBSCRIPTION PLAN",
          newData: JSON.stringify(newSubscriptionPlan),
          section: "SUBSCRIPTION PLAN",
        },
      ]),
    ]);

    response
      .status(201)
      .json({ message: "Subscription plan changed successfully." });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

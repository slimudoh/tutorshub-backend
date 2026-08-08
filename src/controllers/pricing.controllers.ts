import { RequestHandler, Request, Response, NextFunction } from "express";
import { UniqueConstraintError } from "sequelize";
import { createServerError, makeError } from "../services/error.services";
import {
  addPricingPlan,
  fetchAdminPricingPlans,
  findAllPricingPlans,
  findPlanByName,
  findPricingPlanById,
  findUsersSubscriptionPlans,
  updatePricingPlanStatus,
  findPricingBySlug,
  updatePricingPlan,
  findSubscriptionPlanById,
  updateSubscriptionAutoRenew,
  updateSubscriptionPlanStatus,
  createUserSubscription,
  renewUserSubscription,
  oneMonthFromNow,
} from "../services/pricing.services";
import { findUserById } from "../services/user.services";
import {
  createAuditLog,
  createBulkAuditLogs,
} from "../services/auditLog.services";
import {
  DEFAULT_CURRENCY,
  PRICING,
  SUBSCRIPTION,
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from "../utils/constant";
import {
  convertMultipleCurrencies,
  convertSingleCurrency,
  findCurrencyById,
  getUserCurrency,
} from "../services/currency.services";
import SubscriptionPlan from "../models/subscriptionPlan.models";
import { paginationHelper, toSlug } from "../utils/formatter";
import {
  createTransaction,
  getTransactionByReference,
} from "../services/transaction.services";
import { createNotification } from "../services/notification.services";
import { CustomRequest } from "../types/user";

export const getPricingPlans: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    let pricingPlans = await findAllPricingPlans();

    const userCurrency = await getUserCurrency(request);

    pricingPlans = await convertMultipleCurrencies(pricingPlans, userCurrency);

    response.status(201).json({
      data: pricingPlans,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getPricingPlan: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id } = request.params;

    const plan = await findPricingPlanById(id);

    if (!plan) {
      return next(makeError("Plan not found. Please try again later.", 404));
    }

    response.status(200).json({
      data: plan,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getSubscriptionPlans: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;
    const userCurrency = await getUserCurrency(request);

    const [subscriptionPlans, plans] = await Promise.all([
      findUsersSubscriptionPlans(userId),
      findAllPricingPlans(false),
    ]);

    const convertedPlans = await convertMultipleCurrencies(plans, userCurrency);

    subscriptionPlans.forEach((sub: SubscriptionPlan) => {
      if (sub.planId !== null) {
        sub.plan = convertedPlans.find((p) => p.id === sub.planId) ?? null;
      }
    });

    response.status(200).json({ data: subscriptionPlans });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getAdminPricingPlans: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { keyword, pageNumber, pageSize, status } = request.query;
    const { newPageNumber, newPageSize, offsetSize } = paginationHelper(
      pageNumber as string,
      pageSize as string,
    );

    const [pricingPlans, totalRecords] = await Promise.all([
      fetchAdminPricingPlans(
        keyword as string,
        status as string,
        offsetSize,
        newPageSize,
      ),
      fetchAdminPricingPlans(
        keyword as string,
        status as string,
      ) as Promise<number>,
    ]);

    response.status(200).json({
      currentPage: newPageNumber,
      pageSize: newPageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / newPageSize),
      data: pricingPlans,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const reviewAdminPricingPlan: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id, status } = request.body;

    if (status !== PRICING.ACTIVATE && status !== PRICING.SUSPEND) {
      return next(makeError("Invalid status. Please try again later.", 400));
    }

    const plan = await findPricingPlanById(id);
    if (!plan) {
      return next(makeError("Plan not found. Please try again later.", 404));
    }

    const newStatus =
      status === PRICING.ACTIVATE ? PRICING.ACTIVE : PRICING.SUSPENDED;

    if (plan.status === newStatus) {
      return next(
        makeError(
          "Plan is already in the selected status. Please try again later.",
          400,
        ),
      );
    }

    await updatePricingPlanStatus(id, newStatus);

    // Fixed: fetch full reviewer object instead of passing just the ID
    const reviewerId = (request as CustomRequest).user?.id;
    const reviewer = await findUserById(reviewerId);

    await createAuditLog({
      user: JSON.stringify(reviewer),
      action: "REVIEW PRICING PLAN",
      oldData: JSON.stringify(plan),
      newData: JSON.stringify({ ...plan, status: newStatus }),
      section: "PRICING PLAN",
    });

    response.status(200).json({ message: "Plan reviewed successfully." });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const createPricingPlans: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userid = (request as CustomRequest).user?.id;
    const {
      title,
      description,
      amount,
      amountPerSession,
      instructorPercentageFee,
      platformPercentageFee,
      currency,
      billingCycle,
      lessonLimit,
      features,
    } = request.body;

    const slug = toSlug(title);

    const [creator, existingPlan, existingBySlug, newCurrency] =
      await Promise.all([
        findUserById(userid),
        findPlanByName(title),
        findPricingBySlug(slug),
        findCurrencyById(currency),
      ]);

    if (existingPlan) {
      return next(
        makeError(
          "Plan with this name already exists. Please try again later.",
          400,
        ),
      );
    }

    if (existingBySlug) {
      return next(
        makeError(
          "Plan with this slug already exists. Please try again later.",
          400,
        ),
      );
    }

    if (!newCurrency?.symbol) {
      return next(
        makeError("Currency not found. Please try again later.", 404),
      );
    }

    const [convertedPlan, convertedSession] = await Promise.all([
      convertSingleCurrency(
        { amount, currency: newCurrency.symbol },
        DEFAULT_CURRENCY,
      ),
      convertSingleCurrency(
        { amount: amountPerSession, currency: newCurrency.symbol },
        DEFAULT_CURRENCY,
      ),
    ]);

    const plan = await addPricingPlan({
      title,
      slug,
      description,
      currency: convertedPlan.currency,
      amount: convertedPlan.amount,
      amountPerSession: convertedSession.amount,
      instructorPercentageFee,
      platformPercentageFee,
      billingCycle,
      lessonLimit,
      features,
    });

    await createAuditLog({
      user: JSON.stringify(creator),
      action: "CREATE PRICING PLAN",
      newData: JSON.stringify(plan),
      section: "PRICING PLAN",
    });

    response.status(201).json({ message: "Plan created successfully." });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const updatePricingPlans: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const updaterId = (request as CustomRequest).user?.id;
    const { id } = request.params;
    const {
      title,
      description,
      amount,
      amountPerSession,
      instructorPercentageFee,
      platformPercentageFee,
      currency,
      billingCycle,
      lessonLimit,
      features,
    } = request.body;

    const [plan, existingByName, newCurrency, updater] = await Promise.all([
      findPricingPlanById(id),
      findPlanByName(title),
      findCurrencyById(currency),
      findUserById(updaterId),
    ]);

    if (!plan) {
      return next(makeError("Plan not found. Please try again later.", 404));
    }

    if (existingByName && existingByName.id !== id) {
      return next(
        makeError(
          "Plan with this name already exists. Please try again later.",
          400,
        ),
      );
    }

    if (!newCurrency?.symbol) {
      return next(
        makeError("Currency not found. Please try again later.", 404),
      );
    }

    const [convertedPlan, convertedSession] = await Promise.all([
      convertSingleCurrency(
        { amount, currency: newCurrency.symbol },
        DEFAULT_CURRENCY,
      ),
      convertSingleCurrency(
        { amount: amountPerSession, currency: newCurrency.symbol },
        DEFAULT_CURRENCY,
      ),
    ]);

    const updatedPlan = await updatePricingPlan({
      id,
      title,
      description,
      currency: convertedPlan.currency,
      amount: convertedPlan.amount,
      amountPerSession: convertedSession.amount,
      instructorPercentageFee,
      platformPercentageFee,
      billingCycle,
      lessonLimit,
      features,
    });

    await createAuditLog({
      user: JSON.stringify(updater),
      action: "UPDATE PRICING PLAN",
      oldData: JSON.stringify(plan),
      newData: JSON.stringify(updatedPlan),
      section: "PRICING PLAN",
    });

    response.status(200).json({ message: "Plan updated successfully." });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const autoRenewSubscription = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;
    const { id, autoRenew } = request.body;

    const [subscriptionPlan, user] = await Promise.all([
      findSubscriptionPlanById(id, userId),
      findUserById(userId),
    ]);

    if (!subscriptionPlan) {
      return next(
        makeError("Subscription not found. Please try again later.", 404),
      );
    }

    if (subscriptionPlan.autoRenew === autoRenew) {
      return next(makeError("Auto renew is already set to this value.", 400));
    }

    const updatedSubscriptionPlan = await updateSubscriptionAutoRenew(
      id,
      userId,
      autoRenew,
    );

    await createAuditLog({
      user: JSON.stringify(user),
      action: "UPDATE SUBSCRIPTION AUTO RENEW",
      oldData: JSON.stringify(subscriptionPlan),
      newData: JSON.stringify(updatedSubscriptionPlan),
      section: "SUBSCRIPTION PLAN",
    });

    response.status(200).json({
      message: "Subscription auto renew updated successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const reviewSubscriptionPlans: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;
    const { id, reference, status } = request.body;

    if (status !== SUBSCRIPTION.CANCEL && status !== SUBSCRIPTION.RENEW) {
      return next(makeError("Invalid status. Please try again later.", 400));
    }

    const [subscriptionPlan, user] = await Promise.all([
      findSubscriptionPlanById(id, userId),
      findUserById(userId),
    ]);

    if (!subscriptionPlan) {
      return next(
        makeError("Subscription not found. Please try again later.", 404),
      );
    }

    if (status === SUBSCRIPTION.CANCEL) {
      if (subscriptionPlan.status === SUBSCRIPTION.CANCELED) {
        return next(makeError("Subscription is already canceled.", 400));
      }

      await Promise.all([
        updateSubscriptionPlanStatus(id, userId, SUBSCRIPTION.CANCELED),
        createAuditLog({
          user: JSON.stringify(user),
          action: "CANCEL SUBSCRIPTION PLAN",
          oldData: JSON.stringify(subscriptionPlan),
          newData: JSON.stringify({
            ...subscriptionPlan,
            status: SUBSCRIPTION.CANCELED,
          }),
          section: "SUBSCRIPTION PLAN",
        }),
      ]);
    }

    if (status === SUBSCRIPTION.RENEW) {
      if (!reference) {
        return next(
          makeError(
            "Transaction reference is required. Please try again later.",
            400,
          ),
        );
      }

      if (subscriptionPlan.status === SUBSCRIPTION.ACTIVE) {
        return next(makeError("Subscription is already active.", 400));
      }

      if (subscriptionPlan.status !== SUBSCRIPTION.EXPIRED) {
        return next(
          makeError(
            "Subscription can only be renewed if it is expired. Please try again later.",
            400,
          ),
        );
      }

      const plans = await findAllPricingPlans(true, false);
      const plan = plans.find(
        (p) => p.id === subscriptionPlan.planId && p.status === PRICING.ACTIVE,
      );

      if (!plan?.currency || !plan?.amount) {
        return next(makeError("Plan not found. Please try again later.", 404));
      }

      const existingTransaction = await getTransactionByReference(reference);
      if (existingTransaction) {
        return next(makeError("Transaction already exists.", 409));
      }

      let transaction;
      try {
        [transaction] = await Promise.all([
          createTransaction({
            userId,
            transactionType: TRANSACTION_TYPE.PAYMENT,
            reference,
            currency: plan.currency,
            amount: plan.amount,
            status: TRANSACTION_STATUS.SUCCESSFUL,
            channel: "manual",
            purpose: `Subscription Payment for ${plan.title} plan`,
            lessonId: null,
          }),
          renewUserSubscription(userId, id, new Date(), oneMonthFromNow()),
        ]);
      } catch (err) {
        if (err instanceof UniqueConstraintError) {
          return next(makeError("Transaction already exists.", 409));
        }
        throw err;
      }

      await Promise.all([
        createNotification(
          "Your payment was successful",
          `Your payment was successfully processed and subscription plan ${plan.title} renewed.`,
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
            action: "RENEW SUBSCRIPTION PLAN",
            oldData: JSON.stringify(subscriptionPlan),
            newData: JSON.stringify({
              ...subscriptionPlan,
              status: SUBSCRIPTION.ACTIVE,
            }),
            section: "SUBSCRIPTION PLAN",
          },
        ]),
      ]);
    }

    response.status(201).json({
      message: "Subscription plan updated successfully.",
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
        lessonId: null,
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

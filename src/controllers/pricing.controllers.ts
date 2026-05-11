import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError } from "../services/error.services";
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
} from "../services/pricing.services";
import { ResponseError } from "../interfaces";
import { findUserById } from "../services/user.services";
import { createAuditLog } from "../services/auditLog.services";
import { PRICING, SUBSCRIPTION } from "../utils/constant";
import {
  convertMultipleCurrencies,
  convertSingleCurrency,
  findCurrencyById,
  getUserCurrency,
} from "../services/currency.services";
import SubscriptionPlan from "../models/subscriptionPlan.models";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

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

export const getSubscriptionPlans: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;
    const userCurrency = await getUserCurrency(request);

    let subscriptionPlans = await findUsersSubscriptionPlans(userId);

    let plans = await findAllPricingPlans(true, false);

    plans = await convertMultipleCurrencies(plans, userCurrency);

    subscriptionPlans.forEach((plan: SubscriptionPlan) => {
      if (plan.planId !== null) {
        const pricingPlan = plans.find((p) => p.id === plan.planId);
        plan.plan = pricingPlan || null;
      }
    });

    response.status(201).json({
      data: subscriptionPlans,
    });
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
    const newPageNumber = Number(pageNumber);
    const newPageSize = Number(pageSize);
    const offsetSize = (newPageNumber - 1) * newPageSize;

    const pricingPlans = await fetchAdminPricingPlans(
      keyword as string,
      status as string,
      offsetSize,
      newPageSize,
    );

    const totalPages = await fetchAdminPricingPlans(
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
      const error = new Error(
        "Plan not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    response.status(201).json({
      data: plan,
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
    const userId = (request as CustomRequest).user?.id;

    const { id, status } = request.body;

    const plan = await findPricingPlanById(id);

    if (!plan) {
      const error = new Error(
        "Plan not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (status !== PRICING.ACTIVATE && status !== PRICING.SUSPEND) {
      const error = new Error(
        "Invalid status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (status === PRICING.PENDING) {
      const error = new Error(
        "Plan is in PENDING status. You cannot review a pending pricing plan.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (plan.status === status) {
      const error = new Error(
        "Plan is already in the selected status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const newStatus =
      status === PRICING.ACTIVATE ? PRICING.ACTIVE : PRICING.SUSPENDED;

    await updatePricingPlanStatus(id, newStatus);

    const targetUser = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "REVIEW PRICING PLAN",
      oldData: JSON.stringify(plan),
      newData: JSON.stringify({
        ...plan,
        status: newStatus,
      }),
      section: "PRICING PLAN",
    });

    response.status(201).json({
      message: "Plan reviewed successfully.",
    });
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
    const userId = (request as CustomRequest).user?.id;

    const {
      title,
      description,
      amount,
      currency,
      billingCycle,
      lessonLimit,
      features,
    } = request.body;

    const existingPlan = await findPlanByName(title);

    if (existingPlan) {
      const error = new Error(
        "Plan with this name already exists. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const slug = title.toLowerCase().replace(/\s+/g, "-");

    const existingCategoryBySlug = await findPricingBySlug(slug);

    if (existingCategoryBySlug) {
      const error = new Error(
        "Plan with this slug already exists. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const newCurrency = await findCurrencyById(currency);

    if (!newCurrency?.symbol) {
      const error = new Error(
        "Currency not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const convertedCurrency = await convertSingleCurrency(
      {
        amount,
        currency: newCurrency.symbol,
      },
      "USD",
    );

    const plan = await addPricingPlan({
      title,
      slug,
      description,
      amount: convertedCurrency.amount,
      currency: convertedCurrency.currency,
      billingCycle,
      lessonLimit,
      features,
    });

    const targetUser = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "CREATE PRICING PLAN",
      newData: JSON.stringify(plan),
      section: "PRICING PLAN",
    });

    response.status(201).json({
      message: "Plan created successfully.",
    });
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
    const userId = (request as CustomRequest).user?.id;
    const { id } = request.params;
    const {
      title,
      description,
      amount,
      currency,
      billingCycle,
      lessonLimit,
      features,
    } = request.body;

    const plan = await findPricingPlanById(id);

    if (!plan) {
      const error = new Error(
        "Plan not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    let slug = title.toLowerCase().replace(/\s+/g, "-");

    const existingPlanBySlug = await findPricingBySlug(slug);

    if (existingPlanBySlug && existingPlanBySlug.id !== id) {
      const error = new Error(
        `Plan with this slug ${slug} already exists.`,
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const existingPlanByName = await findPlanByName(title);

    if (existingPlanByName && existingPlanByName.id !== id) {
      const error = new Error(
        "Plan with this name already exists. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const newCurrency = await findCurrencyById(currency);

    if (!newCurrency?.symbol) {
      const error = new Error(
        "Currency not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const convertedCurrency = await convertSingleCurrency(
      {
        amount,
        currency: newCurrency.symbol,
      },
      "USD",
    );

    const updatedPlan = await updatePricingPlan({
      id,
      title,
      slug,
      description,
      amount: convertedCurrency.amount,
      currency: convertedCurrency.currency,
      billingCycle,
      lessonLimit,
      features,
    });

    const targetUser = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "UPDATE PRICING PLAN",
      oldData: JSON.stringify(plan),
      newData: JSON.stringify(updatedPlan),
      section: "PRICING PLAN",
    });

    response.status(201).json({
      message: "Plan updated successfully.",
    });
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

    const subscriptionPlan = await findSubscriptionPlanById(id, userId);

    if (!subscriptionPlan) {
      const error = new Error(
        "Subscription not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (subscriptionPlan.autoRenew === autoRenew) {
      const error = new Error(
        "Auto renew is already set to this value.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const updatedSubscriptionPlan = await updateSubscriptionAutoRenew(
      id,
      userId,
      autoRenew,
    );

    const targetUser = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "UPDATE SUBSCRIPTION AUTO RENEW",
      oldData: JSON.stringify(subscriptionPlan),
      newData: JSON.stringify(updatedSubscriptionPlan),
      section: "SUBSCRIPTION PLAN",
    });

    response.status(201).json({
      message: "Subscription auto renew updated successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const cancelSubscriptionPlans: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const userId = (request as CustomRequest).user?.id;

    const { id, status } = request.body;

    const subscriptionPlan = await findSubscriptionPlanById(id, userId);

    if (!subscriptionPlan) {
      const error = new Error(
        "Subscription not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (status !== SUBSCRIPTION.CANCEL) {
      const error = new Error(
        "Invalid status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (subscriptionPlan.status === SUBSCRIPTION.CANCELED) {
      const error = new Error(
        "Subscription is already in the CANCELED status. You cannot cancel a canceled subscription plan.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    await updateSubscriptionPlanStatus(id, userId, SUBSCRIPTION.CANCELED);

    const targetUser = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "CANCEL SUBSCRIPTION PLAN",
      oldData: JSON.stringify(subscriptionPlan),
      newData: JSON.stringify({
        ...subscriptionPlan,
        status: SUBSCRIPTION.CANCELED,
      }),
      section: "SUBSCRIPTION PLAN",
    });

    response.status(201).json({
      message: "Subscription plan cancelled successfully.",
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
    const userId = (request as CustomRequest).user?.id;

    const user = await findUserById(userId);

    if (!user) {
      const error = new Error(
        "User not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const { id } = request.body;

    let subscriptionPlans = await findUsersSubscriptionPlans(userId);
    let plans = await findAllPricingPlans(true, false);
    subscriptionPlans.forEach((plan: SubscriptionPlan) => {
      if (plan.planId !== null) {
        const pricingPlan = plans.find((p) => p.id === plan.planId);
        plan.plan = pricingPlan || null;
      }
    });

    const activeSubscription = subscriptionPlans.find(
      (subscription) => subscription.status !== "CANCELED",
    );

    if (activeSubscription) {
      const error = new Error(
        `You have an active subscription to ${activeSubscription.plan?.title} plan. Please cancel it before changing your plan.`,
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const plan = plans.find(
      (plan) => plan.id === id && plan.status === PRICING.ACTIVE,
    );

    if (!plan) {
      const error = new Error(
        "Plan not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const newSubscriptionPlan = await createUserSubscription(user, plan);

    const targetUser = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(targetUser),
      action: "CHANGE SUBSCRIPTION PLAN",
      oldData: activeSubscription ? JSON.stringify(activeSubscription) : "",
      newData: JSON.stringify(newSubscriptionPlan),
      section: "SUBSCRIPTION PLAN",
    });

    response.status(201).json({
      message: "Subscription plan changed successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

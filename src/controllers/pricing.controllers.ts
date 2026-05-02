import { RequestHandler, Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createServerError } from "../services/error.services";
import {
  fetchAdminPricingPlans,
  findAllPricingPlans,
  findPricingPlanById,
  findUsersSubscriptionPlans,
  updatePricingPlanStatus,
} from "../services/pricing.services";
import { ResponseError } from "../interfaces";
import { findUserById } from "../services/user.services";
import { createAuditLog } from "../services/auditLog.services";
import { PRICING } from "../utils/constant";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const getPricingPlans: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const pricingPlans = await findAllPricingPlans();

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

    const subscriptionPlans = await findUsersSubscriptionPlans(userId);

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
      action: newStatus,
      oldData: JSON.stringify(plan),
      newData: JSON.stringify({
        ...plan,
        status: newStatus,
      }),
      section: "REVIEW PRICING PLAN",
    });

    response.status(201).json({
      message: "Plan reviewed successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

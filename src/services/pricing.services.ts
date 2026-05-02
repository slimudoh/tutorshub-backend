import { Op } from "@sequelize/core";
import PricingPlan from "../models/pricingPlan.models";
import SubscriptionPlan from "../models/subscriptionPlan.models";
import { PRICING_PLAN_EXCLUDED_ATTRIBUTES } from "../utils/constant";

export const findAllPricingPlans = async (excludeAttributes = true) => {
  return await PricingPlan.findAll({
    ...(excludeAttributes && {
      attributes: {
        exclude: PRICING_PLAN_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const findUsersSubscriptionPlans = async (userId: string) => {
  return await SubscriptionPlan.findAll({
    where: {
      userId,
    },
    raw: true,
  });
};

export const findPricingPlanById = async (id: string) => {
  return await PricingPlan.findOne({
    where: {
      id,
    },
    raw: true,
  });
};

export const updatePricingPlanStatus = async (id: string, status: string) => {
  return await PricingPlan.update(
    {
      status,
    },
    {
      where: {
        id,
      },
    },
  );
};

export const fetchAdminPricingPlans = async (
  keyword?: string,
  status?: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [
        { name: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
      ],
    };
  }

  if (status) {
    where = {
      ...where,
      status,
    };
  }

  if (!offsetSize && !newPageSize) {
    return await PricingPlan.count({ where: { ...where } });
  }

  return await PricingPlan.findAll({
    where: { ...where },
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: PRICING_PLAN_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

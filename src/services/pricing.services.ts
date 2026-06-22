import { literal, Op } from "@sequelize/core";
import PricingPlan from "../models/pricingPlan.models";
import SubscriptionPlan from "../models/subscriptionPlan.models";
import {
  MAIL_CONFIG,
  PRICING,
  PRICING_PLAN_EXCLUDED_ATTRIBUTES,
  SUBSCRIPTION,
} from "../utils/constant";
import User from "../models/user.models";
import moment from "moment";
import { format } from "date-fns";
import { createAuditLog } from "./auditLog.services";
import { createNotification } from "./notification.services";
import { sendSingleMail } from "./email.services";
import { findAllActiveUsers } from "./user.services";

export const findAllPricingPlans = async (
  includeFree = true,
  excludeAttributes = true,
) => {
  console.log({ includeFree });
  return await PricingPlan.findAll({
    where: {
      ...(includeFree && { amount: { [Op.gt]: 0 } }),
      status: PRICING.ACTIVE,
    },
    ...(excludeAttributes && {
      attributes: { exclude: PRICING_PLAN_EXCLUDED_ATTRIBUTES },
    }),
    order: [["createdAt", "ASC"]],
    raw: true,
  });
};

export const findAllSubscriptionPlans = async () => {
  return await SubscriptionPlan.findAll({
    where: {
      status: SUBSCRIPTION.ACTIVE,
    },
    order: [["createdAt", "ASC"]],
    raw: true,
  });
};

export const findUsersSubscriptionPlans = async (userId: string) => {
  return await SubscriptionPlan.findAll({
    where: {
      userId,
    },
    order: [["status", "ASC"]],
    raw: true,
  });
};

export const findPricingPlanById = async (id: string) => {
  return await PricingPlan.findOne({ where: { id }, raw: true });
};

export const findPricingBySlug = async (slug: string) => {
  return await PricingPlan.findOne({ where: { slug }, raw: true });
};

export const updatePricingPlanStatus = async (id: string, status: string) => {
  return await PricingPlan.update({ status }, { where: { id } });
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
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: PRICING_PLAN_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const findPlanByName = async (title: string) => {
  return await PricingPlan.findOne({ where: { title }, raw: true });
};

export const addPricingPlan = async (data: {
  title: string;
  slug: string;
  description: string;
  currency: string;
  amount: number;
  amountPerSession: number;
  instructorPercentageFee: number;
  platformPercentageFee: number;
  billingCycle: string;
  lessonLimit: number;
  features: string[];
}) => {
  return await PricingPlan.create({
    id: crypto.randomUUID(),
    title: data.title,
    slug: data.slug,
    description: data.description,
    amount: data.amount,
    currency: data.currency,
    amountPerSession: data.amountPerSession,
    instructorPercentageFee: data.instructorPercentageFee,
    platformPercentageFee: data.platformPercentageFee,
    billingCycle: data.billingCycle,
    lessonLimit: data.lessonLimit,
    isUnlimited: false,
    features: JSON.stringify(data.features),
    status: PRICING.ACTIVE,
  });
};

export const updatePricingPlan = async (data: {
  id: string;
  title: string;
  slug: string;
  description: string;
  currency: string;
  amount: number;
  amountPerSession: number;
  instructorPercentageFee: number;
  platformPercentageFee: number;
  billingCycle: string;
  lessonLimit: number;
  features: string[];
}) => {
  return await PricingPlan.update(
    {
      title: data.title,
      slug: data.slug,
      description: data.description,
      currency: data.currency,
      amount: data.amount,
      amountPerSession: data.amountPerSession,
      instructorPercentageFee: data.instructorPercentageFee,
      platformPercentageFee: data.platformPercentageFee,
      billingCycle: data.billingCycle,
      lessonLimit: data.lessonLimit,
      features: JSON.stringify(data.features),
    },
    {
      where: {
        id: data.id,
      },
    },
  );
};

export const findFreePlan = async () => {
  return await PricingPlan.findOne({
    where: { amount: 0 },
    attributes: { exclude: PRICING_PLAN_EXCLUDED_ATTRIBUTES },
    raw: true,
  });
};

export const createUserSubscription = async (
  user: User,
  plan: PricingPlan,
  autoRenew: boolean,
) => {
  return await SubscriptionPlan.create({
    id: crypto.randomUUID(),
    userId: user.id,
    planId: plan.id,
    subscriptionNumber: `SUB-${user.firstName?.substring(0, 3).toUpperCase()}${user.lastName?.substring(0, 3).toUpperCase()}-${Date.now()}`,
    autoRenew,
    startDate: new Date(),
    endDate: oneMonthFromNow(),
    creditsBalance: plan.lessonLimit,
    status: SUBSCRIPTION.ACTIVE,
  });
};

export const updateUserSubscription = async (
  userId: string,
  subscriptionId: string,
  startDate: Date,
  endDate: Date,
) => {
  return await SubscriptionPlan.update(
    { startDate, endDate, status: SUBSCRIPTION.ACTIVE },
    { where: { id: subscriptionId, userId, status: SUBSCRIPTION.ACTIVE } },
  );
};

export const findSubscriptionPlanById = async (id: string, userId: string) => {
  return await SubscriptionPlan.findOne({
    where: {
      id,
      userId,
      status: SUBSCRIPTION.ACTIVE,
    },
    raw: true,
  });
};

export const updateSubscriptionAutoRenew = async (
  id: string,
  userId: string,
  autoRenew: boolean,
) => {
  return await SubscriptionPlan.update(
    { autoRenew },
    { where: { id, userId, status: SUBSCRIPTION.ACTIVE } },
  );
};

export const updateSubscriptionPlanStatus = async (
  id: string,
  userId: string,
  status: string,
) => {
  return await SubscriptionPlan.update(
    { status },
    { where: { id, userId, status: SUBSCRIPTION.ACTIVE } },
  );
};

export const renewSubscriptionPlans = async () => {
  const [subscriptionPlans, freePlan] = await Promise.all([
    findAllSubscriptionPlans(),
    findFreePlan(),
  ]);

  for (const subscription of subscriptionPlans) {
    if (!subscription?.id || !subscription?.endDate || !subscription?.userId) {
      continue;
    }

    if (!isExpired(subscription.endDate)) continue;

    let updateLog = null;
    let statusLog = null;

    if (subscription.autoRenew) {
      updateLog = await updateUserSubscription(
        subscription.userId,
        subscription.id,
        new Date(),
        oneMonthFromNow(),
      );

      // if paid plan and payment failed, expire instead
      if (freePlan?.id !== subscription.planId) {
        statusLog = await updateSubscriptionPlanStatus(
          subscription.id,
          subscription.userId,
          SUBSCRIPTION.EXPIRED,
        );
      }
    } else {
      statusLog = await updateSubscriptionPlanStatus(
        subscription.id,
        subscription.userId,
        SUBSCRIPTION.EXPIRED,
      );
    }

    const auditBase = {
      action: "CHANGE SUBSCRIPTION PLAN",
      oldData: JSON.stringify(subscription),
      section: "SUBSCRIPTION PLAN",
    };

    if (updateLog) {
      await createAuditLog({
        ...auditBase,
        newData: JSON.stringify(updateLog),
      });
    }

    if (statusLog) {
      await createAuditLog({
        ...auditBase,
        newData: JSON.stringify(statusLog),
      });
    }
  }
};

export const sendExpiryNotification = async () => {
  const [subscriptionPlans, freePlan, users] = await Promise.all([
    findAllSubscriptionPlans(),
    findFreePlan(),
    findAllActiveUsers(),
  ]);

  for (const subscription of subscriptionPlans) {
    if (!subscription?.id || !subscription?.endDate || !subscription?.userId) {
      continue;
    }

    if (freePlan?.id === subscription.planId || subscription.autoRenew) {
      continue;
    }

    for (let daysLeft = 5; daysLeft > 0; daysLeft--) {
      const notifyDate = format(
        moment(subscription.endDate).subtract(daysLeft, "days").toDate(),
        "yyyy-MM-dd",
      );

      if (format(new Date(), "yyyy-MM-dd") < notifyDate) continue;

      const message = `Your subscription plan will expire in ${daysLeft} days. Please renew your subscription plan to continue using our services.`;

      await createNotification(
        "Subscription Plan Expiry",
        message,
        subscription.userId,
      );
    }
  }
};

export const subtractSubscriptionCredits = async (
  userId: string,
  subscriptionId: string,
  credits: number,
) => adjustSubscriptionCredits(userId, subscriptionId, -credits);

export const addSubscriptionCredits = async (
  userId: string,
  subscriptionId: string,
  credits: number,
) => adjustSubscriptionCredits(userId, subscriptionId, credits);

export const oneMonthFromNow = () => moment().add(1, "month").toDate();

export const adjustSubscriptionCredits = async (
  userId: string,
  subscriptionId: string,
  delta: number,
) => {
  const subscription = await SubscriptionPlan.findOne({
    where: { id: subscriptionId, userId, status: SUBSCRIPTION.ACTIVE },
    raw: true,
  });

  if (!subscription?.id || subscription?.creditsBalance == null) return false;

  await SubscriptionPlan.update(
    { creditsBalance: subscription.creditsBalance + delta },
    { where: { id: subscription.id } },
  );

  return true;
};

export const isExpired = (endDate: Date) =>
  format(new Date(), "yyyy-MM-dd") >= format(endDate, "yyyy-MM-dd");

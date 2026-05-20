import { Op } from "@sequelize/core";
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
  excludeAttributes = true,
  includeFree = true,
) => {
  return await PricingPlan.findAll({
    where: {
      ...(includeFree && { amount: { [Op.gt]: 0 } }),
      status: PRICING.ACTIVE,
    },
    ...(excludeAttributes && {
      attributes: {
        exclude: PRICING_PLAN_EXCLUDED_ATTRIBUTES,
      },
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
  return await PricingPlan.findOne({
    where: {
      id,
    },
    raw: true,
  });
};

export const findPricingBySlug = async (slug: string) => {
  return await PricingPlan.findOne({
    where: {
      slug,
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

export const findPlanByName = async (title: string) => {
  return await PricingPlan.findOne({
    where: {
      title,
    },
    raw: true,
  });
};

export const addPricingPlan = async (data: {
  title: string;
  slug: string;
  description: string;
  amount: number;
  currency: string;
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
  amount: number;
  currency: string;
  billingCycle: string;
  lessonLimit: number;
  features: string[];
}) => {
  return await PricingPlan.update(
    {
      title: data.title,
      slug: data.slug,
      description: data.description,
      amount: data.amount,
      currency: data.currency,
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
    where: {
      amount: 0,
    },
    attributes: {
      exclude: PRICING_PLAN_EXCLUDED_ATTRIBUTES,
    },
    raw: true,
  });
};

export const createUserSubscription = async (user: User, plan: PricingPlan) => {
  const autoRenew = !plan?.amount || plan.amount < 1;

  return await SubscriptionPlan.create({
    id: crypto.randomUUID(),
    userId: user.id,
    planId: plan.id,
    subscriptionNumber: `SUB-${user?.firstName?.substring(0, 3).toUpperCase()}${user?.lastName?.substring(0, 3).toUpperCase()}-${Date.now()}`,
    autoRenew,
    startDate: new Date(),
    endDate: moment().add(1, "month").toDate(),
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
    {
      startDate,
      endDate,
      status: SUBSCRIPTION.ACTIVE,
    },
    {
      where: {
        id: subscriptionId,
        userId,
        status: SUBSCRIPTION.ACTIVE,
      },
    },
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
    {
      autoRenew,
    },
    {
      where: {
        id,
        userId,
        status: SUBSCRIPTION.ACTIVE,
      },
    },
  );
};

export const updateSubscriptionPlanStatus = async (
  id: string,
  userId: string,
  status: string,
) => {
  return await SubscriptionPlan.update(
    {
      status,
    },
    {
      where: {
        id,
        userId,
        status: SUBSCRIPTION.ACTIVE,
      },
    },
  );
};

export const renewSubscriptionPlans = async () => {
  const subscriptionPlans = await findAllSubscriptionPlans();
  const freePlan = await findFreePlan();

  subscriptionPlans.forEach(async (subscription: SubscriptionPlan) => {
    if (subscription?.id && subscription?.endDate && subscription?.userId) {
      let updateUserSubscriptionLog = null;
      let updateSubscriptionPlanStatusLog = null;

      if (
        format(new Date(), "yyyy-MM-dd") >=
        format(subscription.endDate, "yyyy-MM-dd")
      ) {
        if (subscription?.autoRenew) {
          if (freePlan?.id === subscription?.planId) {
            updateUserSubscriptionLog = await updateUserSubscription(
              subscription.userId,
              subscription.id,
              new Date(),
              moment().add(1, "month").toDate(),
            );
          } else {
            // process payment and if it is successful update sub plan
            updateUserSubscriptionLog = await updateUserSubscription(
              subscription.userId,
              subscription.id,
              new Date(),
              moment().add(1, "month").toDate(),
            );

            // if payment failed and autoRenew is true, update subscription status to expired
            updateSubscriptionPlanStatusLog =
              await updateSubscriptionPlanStatus(
                subscription.id,
                subscription.userId,
                SUBSCRIPTION.EXPIRED,
              );
          }
        } else {
          updateSubscriptionPlanStatusLog = await updateSubscriptionPlanStatus(
            subscription.id,
            subscription.userId,
            SUBSCRIPTION.EXPIRED,
          );
        }
      }

      if (updateUserSubscriptionLog) {
        await createAuditLog({
          action: "CHANGE SUBSCRIPTION PLAN",
          oldData: subscription ? JSON.stringify(subscription) : "",
          newData: JSON.stringify(updateUserSubscriptionLog),
          section: "SUBSCRIPTION PLAN",
        });
      }

      if (updateSubscriptionPlanStatusLog) {
        await createAuditLog({
          action: "CHANGE SUBSCRIPTION PLAN",
          oldData: subscription ? JSON.stringify(subscription) : "",
          newData: JSON.stringify(updateSubscriptionPlanStatusLog),
          section: "SUBSCRIPTION PLAN",
        });
      }
    }
  });
};

export const sendExpiryNotification = async () => {
  const subscriptionPlans = await findAllSubscriptionPlans();
  const freePlan = await findFreePlan();
  const users = await findAllActiveUsers();

  subscriptionPlans.forEach(async (subscription: SubscriptionPlan) => {
    if (subscription?.id && subscription?.endDate && subscription?.userId) {
      // 5 day to end date

      if (freePlan?.id !== subscription?.planId && !subscription?.autoRenew) {
        for (let i = 5; i > 0; i--) {
          if (
            format(new Date(), "yyyy-MM-dd") >=
            format(
              moment(subscription.endDate).subtract(i, "days").toDate(),
              "yyyy-MM-dd",
            )
          ) {
            const newNotification = `Your subscription plan will expire in ${i} days. Please renew your subscription plan to continue using our services.`;

            await createNotification(
              "Subscription Plan Expiry",
              newNotification,
              subscription.userId,
            );

            await createAuditLog({
              user: JSON.stringify(subscription),
              action: "NEW NOTIFICATION",
              newData: JSON.stringify({
                title: "Subscription Plan Expiry",
                message: newNotification,
                receiverId: subscription.userId,
                senderId: null,
              }),
              section: "NOTIFICATION",
            });

            sendSingleMail({
              from: MAIL_CONFIG.sender,
              to:
                users?.find((user: User) => user.id === subscription.userId)
                  ?.emailAddress || "",
              context: {
                title: "Subscription Plan Expiry",
                name:
                  users?.find((user: User) => user.id === subscription.userId)
                    ?.firstName || "",
                message: `Your subscription plan will expire in ${i} days. Please renew your subscription plan to continue using our services.`,
              },
              subject: `Subscription Plan Expiry`,
              template: "userNotification.views",
            });
          }
        }
      }
    }
  });
};

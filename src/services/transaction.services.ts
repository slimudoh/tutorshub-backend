import { Op, Transaction as SequelizeTransaction } from "sequelize";
import Transaction from "../models/transaction.models";
import {
  TRANSACTION_EXCLUDED_ATTRIBUTES,
  USER_EXCLUDED_ATTRIBUTES,
} from "../utils/constant";
import crypto from "crypto";
import User from "../models/user.models";
import { convertMultipleCurrencies } from "./currency.services";

export const getTransactions = async (
  keyword?: string,
  status?: string,
  offsetSize?: number,
  newPageSize?: number,
  userCurrency?: string,
  includeUser = true,
) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [
        { currency: { [Op.like]: `%${keyword}%` } },
        { reference: { [Op.like]: `%${keyword}%` } },
        { channel: { [Op.like]: `%${keyword}%` } },
      ],
    };
  }

  if (status) {
    where = { ...where, status };
  }

  if (!offsetSize && !newPageSize) {
    return await Transaction.count({ where });
  }

  let transactions = await Transaction.findAll({
    where,
    order: [["updatedAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(includeUser && {
      include: [
        {
          model: User,
          as: "user",
          attributes: { exclude: USER_EXCLUDED_ATTRIBUTES },
        },
      ],
    }),
    nest: true, // groups nested association fields properly
    raw: includeUser ? false : true, // can't use raw with include and get nested objects
  });

  // When raw is false, Sequelize instances need .get({ plain: true }) for a clean object
  if (!includeUser) {
    return await convertMultipleCurrencies(transactions, userCurrency || "");
  }

  const plainTransactions = transactions.map((t: any) =>
    t.get({ plain: true }),
  );
  return await convertMultipleCurrencies(plainTransactions, userCurrency || "");
};

export const getUserTransactions = async (
  userId: string,
  transactionType: string,
  keyword?: string,
  status?: string,
  offsetSize?: number,
  newPageSize?: number,
  userCurrency?: string,
) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [
        { currency: { [Op.like]: `%${keyword}%` } },
        { reference: { [Op.like]: `%${keyword}%` } },
        { channel: { [Op.like]: `%${keyword}%` } },
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
    return await Transaction.count({ where });
  }

  let transactions = await Transaction.findAll({
    where: {
      ...where,
      transactionType,
      userId,
    },
    order: [["updatedAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    attributes: {
      exclude: TRANSACTION_EXCLUDED_ATTRIBUTES,
    },
    raw: true,
  });

  transactions = await convertMultipleCurrencies(
    transactions,
    userCurrency || "",
  );

  return transactions;
};

export const getTransactionById = async (
  userId: string,
  transactionType: string,
  id: string,
  excludeAttributes = true,
) => {
  return await Transaction.findOne({
    where: {
      id,
      transactionType,
      userId,
    },
    ...(excludeAttributes && {
      attributes: {
        exclude: TRANSACTION_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const getTransactionByReference = async (
  reference: string,
  excludeAttributes = true,
) => {
  return await Transaction.findOne({
    where: {
      reference,
    },
    ...(excludeAttributes && {
      attributes: {
        exclude: TRANSACTION_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const createTransaction = async (
  transactionData: {
    userId: string | null;
    transactionType: string;
    reference: string;
    currency: string;
    amount: number;
    channel: string;
    status: string;
    purpose: string;
    lessonId: string | null;
  },
  transaction?: SequelizeTransaction,
) => {
  const created = await Transaction.create(
    {
      id: crypto.randomUUID(),
      userId: transactionData.userId,
      transactionType: transactionData.transactionType,
      reference: transactionData.reference,
      amount: transactionData.amount,
      currency: transactionData.currency,
      channel: transactionData.channel,
      status: transactionData.status,
      purpose: transactionData.purpose,
      lessonId: transactionData.lessonId,
    },
    { transaction },
  );

  return created;
};

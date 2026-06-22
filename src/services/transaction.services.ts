import { Op } from "sequelize";
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
  excludeAttributes = true,
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
    where,
    order: [["createdAt", "DESC"]],
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      include: [
        {
          model: User,
          as: "user",
          attributes: { exclude: USER_EXCLUDED_ATTRIBUTES },
        },
      ],
    }),
    raw: true,
  });

  return await convertMultipleCurrencies(transactions, userCurrency || "");
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
    order: [["createdAt", "DESC"]],
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

export const createTransaction = async (transactionData: {
  userId: string;
  transactionType: string;
  reference: string;
  currency: string;
  amount: number;
  channel: string;
  status: string;
  purpose: string;
}) => {
  const transaction = await Transaction.create({
    id: crypto.randomUUID(),
    userId: transactionData.userId,
    transactionType: transactionData.transactionType,
    reference: transactionData.reference,
    amount: transactionData.amount,
    currency: transactionData.currency,
    channel: transactionData.channel,
    status: transactionData.status,
    purpose: transactionData.purpose,
  });

  return transaction;
};

import { Op } from "sequelize";
import Transaction from "../models/transaction.models";
import { TRANSACTION_EXCLUDED_ATTRIBUTES } from "../utils/constant";

export const getTransactions = async (
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
        { currency: { [Op.like]: `%${keyword}%` } },
        { amount: { [Op.like]: `%${keyword}%` } },
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

  return await Transaction.findAll({
    where,
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: TRANSACTION_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const getUserTransactions = async (
  userId: string,
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
        { currency: { [Op.like]: `%${keyword}%` } },
        { amount: { [Op.like]: `%${keyword}%` } },
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

  return await Transaction.findAll({
    where,
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: TRANSACTION_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

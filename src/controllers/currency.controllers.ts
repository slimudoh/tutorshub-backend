import { RequestHandler, Request, Response, NextFunction } from "express";
import {
  fetchAllCurrencies,
  fetchNewRates,
  findCurrencyById,
  findAllActiveCurrencies,
  findRateByFromCurrency,
  updateCurrencyStatus,
  updateCurrency,
  updateAllCurrencies,
  updateCurrenciesList,
  addAllCurrencies,
} from "../services/currency.services";
import { createServerError } from "../services/error.services";
import { ResponseError } from "../interfaces";
import { CURRENCY } from "../utils/constant";
import { createAuditLog } from "../services/auditLog.services";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { findUserById } from "../services/user.services";

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const getCurrencies: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { keyword, status } = request.query;

    const currencies = await fetchAllCurrencies(
      keyword as string,
      status as string,
    );

    response.status(201).json({
      data: currencies,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getCurrencyDetails: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    if (!request.params?.id) {
      const error = new Error(
        "Currency ID is not found. Please try again later",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const currency = await findCurrencyById(request.params?.id);

    if (currency?.status !== CURRENCY.ACTIVE) {
      const error = new Error(
        "Currency is not active. Please try again later",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const rates = await findRateByFromCurrency(currency?.symbol ?? "");

    response.status(201).json({
      data: {
        rates,
        currency,
      },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getAllActiveCurrencies: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    let currencies = await findAllActiveCurrencies();

    response.status(201).json({
      data: currencies,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const getNewCurrencyRates: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    let result: any = await fetchNewRates();

    if (!result.success) {
      const error = new Error(result.message) as ResponseError;
      error.statusCode = 500;
      return next(error);
    }

    const rates = result?.data?.rates;

    if (!rates) {
      const error = new Error(
        "Rates not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    //add new rate ================================================
    // addAllCurrencies(rates);

    //update new rate ================================================
    updateAllCurrencies(rates);
    updateCurrenciesList();

    response.status(201).json({
      message: "Rates updated successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const reviewCurrencies: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { id, status } = request.body;

    const userId = (request as CustomRequest).user?.id;

    const currency = await findCurrencyById(id);

    if (!currency) {
      const error = new Error(
        "Currency not found. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (status !== CURRENCY.ACTIVATE && status !== CURRENCY.SUSPEND) {
      const error = new Error(
        "Invalid status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (status === CURRENCY.PENDING) {
      const error = new Error(
        "Currency is in PENDING status. You cannot review a pending currency.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (currency.status === status) {
      const error = new Error(
        "Currency is already in the selected status. Please try again later.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    if (!currency.country || !currency.currency) {
      const error = new Error(
        "Currency has not been updated. Please update the currency before reviewing.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const newStatus =
      status === CURRENCY.ACTIVATE ? CURRENCY.ACTIVE : CURRENCY.SUSPENDED;

    await updateCurrencyStatus(id, newStatus);

    const user = await findUserById(userId);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "REVIEW CURRENCY",
      oldData: JSON.stringify(currency),
      newData: JSON.stringify({
        ...currency,
        status: newStatus,
      }),
      section: "CURRENCY",
    });

    response.status(201).json({
      message: "Currency reviewed successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const updateCurrencies: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { id, country, countryCode, currency } = request.body;

    await updateCurrency(country, countryCode, currency, id);

    response.status(201).json({
      message: "Currency added successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

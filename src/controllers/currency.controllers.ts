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
import { createServerError, makeError } from "../services/error.services";
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

    response.status(200).json({
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
    const currency = await findCurrencyById(request.params.id);

    if (!currency) {
      return next(
        makeError("Currency not found. Please try again later.", 404),
      );
    }

    if (currency.status !== CURRENCY.ACTIVE) {
      return next(
        makeError("Currency is not active. Please try again later.", 400),
      );
    }

    const rates = await findRateByFromCurrency(currency.symbol ?? "");

    response.status(200).json({ data: { rates, currency } });
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

    response.status(200).json({
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
      return next(makeError(result.message, 500));
    }

    const rates = result?.data?.rates;

    if (!rates) {
      return next(makeError("Rates not found. Please try again later", 404));
    }

    //add new rate ================================================
    // addAllCurrencies(rates);

    //update new rate ================================================
    await Promise.all([updateAllCurrencies(rates), updateCurrenciesList()]);

    response.status(200).json({
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

    if (status !== CURRENCY.ACTIVATE && status !== CURRENCY.SUSPEND) {
      return next(makeError("Invalid status. Please try again later.", 400));
    }

    const currency = await findCurrencyById(id);
    if (!currency) {
      return next(
        makeError("Currency not found. Please try again later.", 404),
      );
    }

    if (!currency.country || !currency.currency) {
      return next(
        makeError(
          "Currency has not been updated. Please update the currency before reviewing.",
          400,
        ),
      );
    }

    const newStatus =
      status === CURRENCY.ACTIVATE ? CURRENCY.ACTIVE : CURRENCY.SUSPENDED;

    if (currency.status === newStatus) {
      return next(
        makeError(
          "Currency is already in the selected status. Please try again later.",
          400,
        ),
      );
    }

    await updateCurrencyStatus(id, newStatus);

    const reviewerId = (request as CustomRequest).user?.id;
    const reviewer = await findUserById(reviewerId);

    await createAuditLog({
      user: JSON.stringify(reviewer),
      action: "REVIEW CURRENCY",
      oldData: JSON.stringify(currency),
      newData: JSON.stringify({ ...currency, status: newStatus }),
      section: "CURRENCY",
    });

    response.status(200).json({ message: "Currency reviewed successfully." });
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

    response.status(200).json({
      message: "Currency added successfully.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

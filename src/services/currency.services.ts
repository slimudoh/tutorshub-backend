import { Op } from "@sequelize/core";
import Currency from "../models/currency.models";
import { CURRENCY, DEFAULT_CURRENCY } from "../utils/constant";
import Rate from "../models/rate.models";

const failedRateResponse = (currency: string) => ({
  success: false,
  message: `We cannot update ${currency} rates at this time. Please try again later.`,
});

export const fetchAllCurrencies = async (keyword?: string, status?: string) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [
        { country: { [Op.like]: `%${keyword}%` } },
        { countryCode: { [Op.like]: `%${keyword}%` } },
        { currency: { [Op.like]: `%${keyword}%` } },
        { symbol: { [Op.like]: `%${keyword}%` } },
      ],
    };
  }

  if (status) {
    where = {
      ...where,
      status,
    };
  }

  return await Currency.findAll({
    where: {
      ...where,
    },
    order: [["status", "ASC"]],
    raw: true,
  });
};

export const findAllActiveCurrencies = async () => {
  let currencies = await Currency.findAll({
    where: { status: CURRENCY.ACTIVE },
    order: [["status", "ASC"]],
    raw: true,
  });

  return currencies;
};

export const findCurrencyById = async (id: string) => {
  return await Currency.findOne({
    where: {
      id,
    },
    raw: true,
  });
};

export const findRateByFromCurrency = async (currency: string) => {
  const rates = await Rate.findAll({
    where: {
      fromCurrency: currency,
    },
    raw: true,
  });

  return rates;
};

const fetchRate = async (currency: string): Promise<Response> => {
  return fetch(`https://open.er-api.com/v6/latest/${currency}`);
};

export const fetchNewRates = async (currency = DEFAULT_CURRENCY) => {
  const response = await fetchRate(currency);

  if (!response.ok) return failedRateResponse(currency);

  const result = await response.json();

  if (result?.result !== "success") return failedRateResponse(currency);

  return { success: true, data: result };
};

export const addAllCurrencies = async (
  rates: Record<string, number>,
): Promise<void> => {
  const newCurrencies = Object.entries(rates).map(([symbol, amount]) => ({
    id: crypto.randomUUID(),
    symbol,
    amount,
    status: CURRENCY.SUSPENDED,
  }));

  await Currency.bulkCreate(newCurrencies);
};

export const updateAllCurrencies = async (
  rates: Record<string, number>,
): Promise<void> => {
  const currencies = await Currency.findAll({
    attributes: ["symbol"],
    raw: true,
  });

  const symbolSet = new Set(currencies.map((c) => c.symbol));

  const updates = Object.entries(rates)
    .filter(([symbol]) => symbolSet.has(symbol))
    .map(([symbol, amount]) =>
      Currency.update({ amount }, { where: { symbol } }),
    );

  await Promise.all(updates);
};

export const updateCurrenciesList = async (): Promise<void> => {
  const currencies = await Currency.findAll({
    where: { status: CURRENCY.ACTIVE },
    attributes: ["symbol"],
    raw: true,
  });

  for (const { symbol } of currencies) {
    if (!symbol) continue;

    const rateData = await getCurrencyData(symbol);
    if (!rateData) continue;

    const newRates = Object.entries(rateData)
      .filter(([, value]) => Number(value) > 0)
      .map(([toCurrency, amount]) => ({
        id: crypto.randomUUID(),
        fromCurrency: symbol,
        toCurrency,
        amount,
        status: CURRENCY.ACTIVE,
      }));

    if (!newRates.length) continue;

    await Rate.destroy({ where: { fromCurrency: symbol } });
    await Rate.bulkCreate(newRates);
  }
};

export const getCurrencyData = async (
  currency: string,
): Promise<Record<string, number> | null> => {
  const response = await fetchRate(currency);

  if (!response.ok) return null;

  const result = await response.json();

  if (result?.result !== "success") return null;

  return result.rates;
};

export const updateCurrencyStatus = async (id: string, status: string) => {
  return await Currency.update({ status }, { where: { id } });
};

export const updateCurrency = async (
  country: string,
  countryCode: string,
  currency: string,
  id: string,
) => {
  return await Currency.update(
    { country, countryCode, currency, status: CURRENCY.ACTIVE },
    { where: { id } },
  );
};

export const getUserCurrency = async (request: any): Promise<string> => {
  const location = request.header("Location");

  const currency = await Currency.findOne({
    where: {
      ...(location ? { countryCode: location } : { symbol: DEFAULT_CURRENCY }),
      status: CURRENCY.ACTIVE,
    },
    raw: true,
  });

  return currency?.symbol || DEFAULT_CURRENCY;
};

export const convertSingleCurrency = async (
  payload: any,
  userCurrency: string,
) => {
  if (!userCurrency) return payload;

  const rate = await Rate.findOne({
    where: {
      fromCurrency: payload.currency,
      toCurrency: userCurrency,
    },
    raw: true,
  });

  if (!rate?.amount) return payload;

  return {
    ...payload,
    currency: userCurrency,
    amount: Number((Number(rate.amount) * payload.amount).toFixed(2)),
  };
};

export const convertMultipleCurrencies = async (
  payload: any[],
  userCurrency: string,
) => {
  if (!userCurrency || !payload.length) return payload;

  const fromCurrencies = [...new Set(payload.map((p) => p.currency))];

  const rates = await Rate.findAll({
    where: {
      fromCurrency: { [Op.in]: fromCurrencies },
      toCurrency: userCurrency,
    },
    raw: true,
  });

  const rateMap = new Map(rates.map((r) => [r.fromCurrency, Number(r.amount)]));

  return payload.map((item) => {
    const rate = rateMap.get(item.currency);
    if (!rate) return item;

    return {
      ...item,
      currency: userCurrency,
      amount: Number((rate * item.amount).toFixed(2)),
    };
  });
};

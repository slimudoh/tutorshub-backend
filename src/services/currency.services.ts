import { Op } from "@sequelize/core";
import Currency from "../models/currency.models";
import { STATUS } from "../utils/constant";
import Rate from "../models/Rate.models";

export const fetchAllCurrencies = async (keyword?: string, status?: string) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [
        { country: { [Op.like]: `%${keyword}%` } },
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
    where: { status: STATUS.ACTIVE },
    order: [["status", "ASC"]],
    raw: true,
  });

  return currencies;
};

export const findCurrencyById = async (id: string) => {
  return await Currency.findOne({
    where: {
      id: id,
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

export const fetchRate = async (currency: string) => {
  let result: any = await fetch(
    `https://open.er-api.com/v6/latest/${currency || "USD"}`,
  );

  return result;
};

export const fetchNewRates = async (currency?: string) => {
  let result: any = await fetchRate(currency || "USD");
  if (!result.ok) {
    return {
      success: false,
      message: `We cannot update ${currency || "USD"} rates at this time. Please try again later.`,
    };
  }

  result = await result.json();

  if (result?.result !== "success") {
    return {
      success: false,
      message: `We cannot update ${currency || "USD"} rates at this time. Please try again later.`,
    };
  }

  return {
    success: true,
    data: result,
  };
};

export const addAllCurrencies = async (rates: any) => {
  const newCurrencies: {
    id: string;
    symbol: string;
    amount: any;
    status: string;
  }[] = [];

  for (const [key, value] of Object.entries(rates)) {
    newCurrencies.push({
      id: crypto.randomUUID(),
      symbol: key,
      amount: value,
      status: STATUS.SUSPENDED,
    });
  }

  await Currency.bulkCreate(newCurrencies);
};

export const updateAllCurrencies = async (rates: any) => {
  const currencies = await Currency.findAll({
    raw: true,
  });

  let newCurrencies: {
    symbol: string;
    amount: any;
  }[] = [];

  for (const [key, value] of Object.entries(rates)) {
    for (const currency of currencies) {
      if (currency.symbol === key) {
        newCurrencies.push({
          symbol: currency.symbol,
          amount: value,
        });
      }
    }
  }

  if (newCurrencies.length > 0) {
    await Promise.all(
      newCurrencies.map((currency) => {
        return Currency.update(
          {
            amount: currency.amount,
          },
          {
            where: {
              symbol: currency.symbol,
            },
          },
        );
      }),
    );
  }
};

export const updateCurrenciesList = async () => {
  const currencies = await Currency.findAll({
    where: {
      status: STATUS.ACTIVE,
    },
    raw: true,
  });

  for (const currency of currencies) {
    if (currency?.symbol) {
      const response = await getCurrencyData(currency.symbol);

      let newRates: any = [];

      for (const [key, value] of Object.entries(response)) {
        if (Number(value) > 0) {
          newRates.push({
            id: crypto.randomUUID(),
            fromCurrency: currency.symbol,
            toCurrency: key,
            amount: value,
            status: STATUS.ACTIVE,
          });
        }
      }

      if (newRates.length > 0) {
        await Rate.destroy({
          where: {
            fromCurrency: currency.symbol,
          },
        });
      }

      await Rate.bulkCreate(newRates);
    }
  }
};

export const getCurrencyData = async (currency: string) => {
  let response: any = await fetchRate(currency);

  if (response.ok) {
    response = await response.json();

    if (response.result === "success") {
      return response.rates;
    }
  }
};

export const updateCurrencyStatus = async (id: string, status: string) => {
  return await Currency.update(
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

export const updateCurrency = async (
  country: string,
  currency: string,
  id: string,
) => {
  return await Currency.update(
    {
      country,
      currency,
      status: STATUS.ACTIVE,
    },
    {
      where: { id },
    },
  );
};

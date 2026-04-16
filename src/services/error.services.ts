import { ResponseError } from "../interfaces";

export const createServerError = async (err: Error, status: number) => {
  console.log({ err });
  let message = "Something went wrong. Please try again later.";
  if (err instanceof Error) message = err.message;
  const error = new Error(message) as ResponseError;
  error.statusCode = status;
  return error;
};

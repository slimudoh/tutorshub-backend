import crypto from "crypto";
import BlackListToken from "../models/blackListToken.models";
import User from "../models/user.models";
import jwt from "jsonwebtoken";
import { USER } from "../utils/constant";

export const findExpiredTokenById = async (token: string) => {
  return await BlackListToken.findOne({
    where: { token },
  });
};

export const createBlackListToken = async (token: string) => {
  return await BlackListToken.create({
    id: crypto.randomUUID(),
    token,
  });
};

export const generateAuthToken = async (user: User) => {
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.TOKEN_SECRET!,
  );

  return token;
};

export const generateEmailToken = async (user: User) => {
  const token = Math.floor(Math.random() * 900000) + 100000;
  await User.update(
    {
      token: token.toString(),
      tokenExpiry: new Date(),
      tokenExpiryStatus: USER.ACTIVE,
    },
    {
      where: {
        id: user.id,
      },
    },
  );

  return token;
};

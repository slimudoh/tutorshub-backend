import crypto from "crypto";
import User from "../models/user.models";
import { USER } from "../utils/constant";
import jwt, { JwtPayload } from "jsonwebtoken";
import BlackListToken from "../models/blackListToken.models";
import { Users } from "../interfaces/user";
import { Request } from "express";

interface IJwtPayload extends JwtPayload {
  user: Users | JwtPayload;
}

const TOKEN_SECRET = process.env.TOKEN_SECRET!;

export const isBlacklisted = async (token: string): Promise<boolean> => {
  const found = await BlackListToken.findOne({ where: { token } });
  return !!found;
};

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
    TOKEN_SECRET,
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

export const verifyToken = async (
  token: string,
): Promise<IJwtPayload | null> => {
  if (await isBlacklisted(token)) return null;

  try {
    return jwt.verify(token, TOKEN_SECRET) as IJwtPayload;
  } catch {
    return null;
  }
};

export const generateJwtTokenForLessonRoom = (
  userId: string,
  lessonId: string,
) => {
  return jwt.sign(
    {
      id: userId,
      lessonId,
    },
    TOKEN_SECRET,
  );
};

export const resolveOptionalUserId = async (
  request: Request,
): Promise<string | null> => {
  const token = request.headers.authorization?.split(" ")[1];
  if (!token) return null;
  const decoded = await verifyToken(token);
  return decoded?.id ?? null;
};

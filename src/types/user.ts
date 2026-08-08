import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";

export type UserProfileData = {
  avatar: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneCode: string;
  phoneNumber: string;
  profession: string;
  userName: string;
  dateOfBirth: string;
  country: string;
  address: string;
  role: string;
};

export type UpdateUserProfileData = Partial<{
  avatar: string | null;
  firstName: string;
  lastName: string;
  phoneCode: string;
  phoneNumber: string;
  profession: string;
  userName: string;
  dateOfBirth: string;
  address: string;
  country: string;
}>;

export interface IJwtPayload extends JwtPayload {
  id: string;
  role: string;
}

export interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

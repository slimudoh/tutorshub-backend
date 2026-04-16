import User from "../models/user.models";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  STATUS,
  VERIFICATION,
  ROLES,
  USER_EXCLUDED_ATTRIBUTES,
} from "../utils/constant";
import { Op } from "sequelize";
import moment from "moment";
import path from "path";
import fs from "fs";
import DeletedAccount from "../models/deletedAccount.models";

export const deleteUserByEmail = async (emailAddress: string) => {
  await User.destroy({
    where: {
      emailAddress: emailAddress,
    },
  });
};

export const getUserName = (firstName: string) => {
  const timestamp = Date.now().toString(36);
  const randomness = Math.random().toString(36).substring(2);
  return `${firstName.toLowerCase()}-${timestamp}${randomness}`;
};

export const createUser = async (
  firstName: string,
  lastName: string,
  emailAddress: string,
  phoneCode: string,
  phoneNumber: string,
  password: string,
) => {
  const hashedPassword = await bcrypt.hash(String(password), 15);
  const userName = getUserName(firstName);
  const token = Math.floor(Math.random() * 900000) + 100000;

  const user = await User.create({
    id: crypto.randomUUID(),
    firstName,
    lastName,
    userName,
    emailAddress,
    password: hashedPassword,
    role: ROLES.USER,
    status: STATUS.PENDING,
    emailVerified: VERIFICATION.NOT_VERIFIED,
    token: token.toString(),
    phoneCode,
    phoneNumber,
    tokenExpiry: new Date(),
    tokenExpiryStatus: STATUS.ACTIVE,
  });

  return user;
};

export const findUserById = async (id: string, excludeAttributes = true) => {
  return await User.findOne({
    where: {
      id: id,
    },
    ...(excludeAttributes && {
      attributes: {
        exclude: USER_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const findUserByEmail = async (emailAddress: string) => {
  return await User.findOne({
    where: {
      emailAddress,
    },
  });
};

export const compareSecretValues = (
  currentValue: string,
  userValue: string,
) => {
  return bcrypt.compare(currentValue, userValue);
};

export const findUserByIdAndActiveToken = async (id: string, token: string) => {
  return await User.findOne({
    where: {
      id,
      token,
      tokenExpiryStatus: STATUS.ACTIVE,
      tokenExpiry: { [Op.ne]: null },
    },
  });
};

export const getTokenExpiryTime = (user: User) => {
  const expiryDate = moment(user.tokenExpiry);
  const currentDate = moment(new Date());
  const duration = moment.duration(currentDate.diff(expiryDate));
  const minutes = duration.minutes();
  return minutes;
};

export const verifyUserEmailByToken = async (user: User) => {
  user.status = STATUS.ACTIVE;
  user.emailVerified = VERIFICATION.VERIFIED;
  user.emailVerifiedAt = new Date();
  user.tokenExpiryStatus = STATUS.CLOSED;
  user.tokenExpiry = null;
  await user.save();
};

export const forgotUserPassword = async (user: User) => {
  const token = Math.floor(Math.random() * 900000) + 100000;
  user.token = token.toString();
  user.tokenExpiry = new Date();
  user.tokenExpiryStatus = STATUS.ACTIVE;
  user.password = crypto.randomUUID();
  await user.save();
  return user;
};

export const resetUserPassword = async (user: User, password: string) => {
  const hashedPassword = await bcrypt.hash(String(password), 15);
  user.password = hashedPassword;
  user.tokenExpiryStatus = STATUS.CLOSED;
  user.tokenExpiry = null;
  await user.save();
};

export const getAllUsers = async (
  keyword: string,
  status: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [
        { firstName: { [Op.like]: `%${keyword}%` } },
        { lastName: { [Op.like]: `%${keyword}%` } },
        { emailAddress: { [Op.like]: `%${keyword}%` } },
        { phoneNumber: { [Op.like]: `%${keyword}%` } },
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
    return await User.count({ where });
  }

  return await User.findAll({
    where,

    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: USER_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const updateUserStatus = async (id: string, status: string) => {
  await User.update({ status }, { where: { id } });
};

export const updateUserProfile = async (id: string, data: any) => {
  return await User.update(data, { where: { id } });
};

export const getUserProfile = (userProfile: User) => {
  return {
    avatar: userProfile?.avatar ?? "",
    firstName: userProfile?.firstName ?? "",
    lastName: userProfile?.lastName ?? "",
    emailAddress: userProfile?.emailAddress ?? "",
    phoneCode: userProfile?.phoneCode ?? "",
    phoneNumber: userProfile?.phoneNumber ?? "",
    profession: userProfile?.profession ?? "",
    userName: userProfile?.userName ?? "",
    dateOfBirth: userProfile?.dateOfBirth ?? "",
    country: userProfile?.country ?? "",
    address: userProfile?.address ?? "",
  };
};

export const deleteUserAvatar = async (filename: string) => {
  const filePath = path.join(__dirname, "../../uploads", filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const deleteUser = async (
  id: string,
  reason: string,
  description: string,
) => {
  await User.update({ status: STATUS.DEACTIVATED }, { where: { id } });
  await DeletedAccount.create({
    id: crypto.randomUUID(),
    userId: id,
    reason,
    description,
  });
};

export const verifyUserPassword = async (
  password: string,
  userPassword: string,
) => {
  return await bcrypt.compare(password, userPassword);
};

export const checkUserAccountStatus = async (status: string | null) => {
  if (!status) {
    return {
      message: "Your account has been deleted. Please contact support.",
      status: 401,
    };
  }

  if (status === STATUS.DEACTIVATED) {
    return {
      message: "Your account has been deactivated. Please contact support.",
      status: 401,
    };
  }

  if (status === STATUS.PENDING) {
    return {
      message: "Your account is pending.",
      status: 401,
    };
  }

  if (status === STATUS.SUSPENDED) {
    return {
      message: "Your account has been suspended. Please contact support.",
      status: 401,
    };
  }

  if (status === STATUS.INACTIVE) {
    return {
      message: "Your account has been deactivated. Please contact support.",
      status: 401,
    };
  }

  if (status === STATUS.BANNED) {
    return {
      message: "Your account has been banned. Please contact support.",
      status: 401,
    };
  }

  return {
    message: "",
    status: 200,
  };
};

export const checkUserEmailVerificationStatus = async (
  emailVerified: string | null,
) => {
  if (!emailVerified) {
    return {
      message:
        "Your email address has not been verified. Please verify your email address.",
      status: 401,
    };
  }

  if (emailVerified === VERIFICATION.NOT_VERIFIED) {
    return {
      message:
        "Your email address has not been verified. Please verify your email address.",
      status: 401,
    };
  }

  return {
    message: "",
    status: 200,
  };
};

export const getDeletedUser = async (userId: string) => {
  return await DeletedAccount.findOne({
    where: { userId },
    raw: true,
  });
};

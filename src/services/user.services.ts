import User from "../models/user.models";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  USER,
  VERIFICATION,
  ROLES,
  USER_EXCLUDED_ATTRIBUTES,
} from "../utils/constant";
import { Op } from "sequelize";
import moment from "moment";
import DeletedAccount from "../models/deletedAccount.models";
import sequelize from "../utils/db";

export const deleteUserByEmail = async (emailAddress: string) => {
  await User.destroy({
    where: {
      emailAddress: emailAddress,
    },
  });
};

export const getUserName = async (firstName: string): Promise<string> => {
  const adjectives = ["swift", "bright", "cool", "lucky", "bold"];
  const nouns = ["tiger", "falcon", "panda", "eagle", "wolf"];

  for (let attempts = 0; attempts < 10; attempts++) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const suffix = Math.floor(100 + Math.random() * 900);
    const candidate = `${firstName.toLowerCase()}_${adj}_${noun}_${suffix}`;

    const exists = await User.findOne({ where: { userName: candidate } });
    if (!exists) return candidate;
  }

  return `${firstName.toLowerCase()}_${crypto.randomUUID().slice(0, 8)}`;
};

export const createUser = async (
  firstName: string,
  lastName: string,
  emailAddress: string,
  password: string,
  country: string,
) => {
  const hashedPassword = await bcrypt.hash(String(password), 12);
  const userName = await getUserName(firstName);
  const token = Math.floor(Math.random() * 900000) + 100000;

  const user = await User.create({
    id: crypto.randomUUID(),
    firstName,
    lastName,
    userName,
    emailAddress,
    password: hashedPassword,
    country,
    role: ROLES.USER,
    status: USER.PENDING,
    emailVerified: VERIFICATION.NOT_VERIFIED,
    token: token.toString(),
    tokenExpiry: new Date(),
    tokenExpiryStatus: USER.ACTIVE,
  });

  return user;
};

export const findUserById = async (id: string, excludeAttributes = true) => {
  return await User.findOne({
    where: {
      id,
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
      tokenExpiryStatus: USER.ACTIVE,
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
  user.status = USER.ACTIVE;
  user.emailVerified = VERIFICATION.VERIFIED;
  user.emailVerifiedAt = new Date();
  user.tokenExpiryStatus = USER.CLOSED;
  user.tokenExpiry = null;
  await user.save();
};

export const forgotUserPassword = async (user: User) => {
  const token = Math.floor(Math.random() * 900000) + 100000;
  user.token = token.toString();
  user.tokenExpiry = new Date();
  user.tokenExpiryStatus = USER.ACTIVE;
  user.password = crypto.randomUUID();
  await user.save();
  return user;
};

export const resetUserPassword = async (user: User, password: string) => {
  const hashedPassword = await bcrypt.hash(String(password), 15);
  user.password = hashedPassword;
  user.tokenExpiryStatus = USER.CLOSED;
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
        { userName: { [Op.like]: `%${keyword}%` } },
        { role: { [Op.like]: `%${keyword}%` } },
        { country: { [Op.like]: `%${keyword}%` } },
        { dateOfBirth: { [Op.like]: `%${keyword}%` } },
        { address: { [Op.like]: `%${keyword}%` } },
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
    ...(offsetSize !== undefined && { offset: offsetSize }),
    ...(newPageSize !== undefined && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: USER_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const getAllActiveAdminUsers = async () => {
  return await User.findAll({
    where: {
      role: {
        [Op.in]: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      },
      status: USER.ACTIVE,
    },
    raw: true,
    attributes: {
      exclude: USER_EXCLUDED_ATTRIBUTES,
    },
  });
};

export const getAllActiveUsers = async () => {
  return await User.findAll({
    where: {
      status: USER.ACTIVE,
    },
    raw: true,
    attributes: {
      exclude: USER_EXCLUDED_ATTRIBUTES,
    },
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
    role: userProfile?.role ?? "",
  };
};

export const deleteUser = async (
  id: string,
  reason: string,
  description: string,
) => {
  const t = await sequelize.transaction();
  try {
    await User.update(
      { status: USER.DEACTIVATED },
      { where: { id }, transaction: t },
    );
    await DeletedAccount.create(
      { id: crypto.randomUUID(), userId: id, reason, description },
      { transaction: t },
    );
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const verifyUserPassword = async (
  password: string,
  userPassword: string,
) => {
  return await bcrypt.compare(password, userPassword);
};

export const checkUserAccountStatus = (status: string | null) => {
  if (!status) {
    return {
      message: "Your account has been deleted. Please contact support.",
      status: 401,
    };
  }

  if (status === USER.DEACTIVATED) {
    return {
      message: "Your account has been deactivated. Please contact support.",
      status: 401,
    };
  }

  if (status === USER.SUSPENDED) {
    return {
      message: "Your account has been suspended. Please contact support.",
      status: 401,
    };
  }

  if (status === USER.INACTIVE) {
    return {
      message: "Your account has been deactivated. Please contact support.",
      status: 401,
    };
  }

  if (status === USER.BANNED) {
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

export const checkUserEmailVerificationStatus = (
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

export const findAllActiveUsers = async () => {
  return await User.findAll({
    where: {
      status: USER.ACTIVE,
    },
    raw: true,
    attributes: {
      exclude: USER_EXCLUDED_ATTRIBUTES,
    },
  });
};

export const findAllUsers = async () => {
  return await User.findAll({
    raw: true,
    attributes: {
      exclude: USER_EXCLUDED_ATTRIBUTES,
    },
  });
};

export const updateUserRole = async (id: string, role: string) => {
  await User.update({ role }, { where: { id } });
};

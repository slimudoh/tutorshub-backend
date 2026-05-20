import { RequestHandler, Request, Response, NextFunction } from "express";
import { USER, VERIFICATION, MAIL_CONFIG, APP_NAME } from "../utils/constant";
import { ResponseError } from "../interfaces";
import {
  checkUserAccountStatus,
  checkUserEmailVerificationStatus,
  compareSecretValues,
  createUser,
  findUserByEmail,
  findUserById,
  findUserByIdAndActiveToken,
  forgotUserPassword,
  getTokenExpiryTime,
  resetUserPassword,
  verifyUserEmailByToken,
} from "../services/user.services";
import { sendSingleMail } from "../services/email.services";
import {
  createBlackListToken,
  findExpiredTokenById,
  generateAuthToken,
  generateEmailToken,
} from "../services/auth.services";
import { createServerError } from "../services/error.services";
import { createAuditLog } from "../services/auditLog.services";
import {
  createNotificationSettingsByUserId,
  getNotificationSettingsByUserId,
} from "../services/setting.services";
import moment from "moment";
import { createNotification } from "../services/notification.services";
import {
  createUserSubscription,
  findFreePlan,
} from "../services/pricing.services";

export const registerUser: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const { firstName, lastName, emailAddress, password, country } =
      request.body;

    const user = await createUser(
      firstName,
      lastName,
      emailAddress,
      password,
      country,
    );

    let plan = await findFreePlan();

    if (plan?.id) {
      const subscription = await createUserSubscription(user, plan);

      await createAuditLog({
        user: JSON.stringify(user),
        action: "CREATE USER SUBSCRIPTION",
        newData: JSON.stringify(subscription),
        section: "SUBSCRIPTION",
      });
    }

    if (user?.id) {
      const notification = await createNotificationSettingsByUserId(user.id, [
        { id: "emailNotification", value: true },
        { id: "pushNotification", value: true },
        { id: "login", value: true },
        { id: "newLesson", value: true },
        { id: "lessonNotSubscribed", value: true },
        { id: "lessonSubscribed1Day", value: true },
        { id: "lessonSubscribed1Hour", value: true },
        { id: "lessonSubscribed30Minutes", value: true },
        { id: "lessonSubscribed15Minutes", value: true },
        { id: "lessonSubscribed5Minutes", value: true },
        { id: "newMessage", value: true },
        { id: "lessonComplete", value: true },
        { id: "weeklySummary", value: true },
        { id: "monthlySummary", value: true },
        { id: "newStudent", value: false },
        { id: "showProfilePublicly", value: false },
        { id: "newReview", value: true },
        { id: "newBooking", value: true },
        { id: "bookingReminder", value: true },
        { id: "bookingCanceled", value: true },
        { id: "bookingCompleted", value: true },
        { id: "bookingRescheduled", value: true },
      ]);

      await createAuditLog({
        user: JSON.stringify(user),
        action: "CREATE NOTIFICATION SETTINGS",
        newData: JSON.stringify(notification),
        section: "SETTINGS",
      });
    }

    sendSingleMail({
      from: MAIL_CONFIG.sender,
      to: emailAddress,
      subject: `Welcome to ${APP_NAME}`,
      template: "register.views",
      context: {
        name: user.firstName,
        token: user.token,
      },
    });

    await createAuditLog({
      user: JSON.stringify(user),
      action: "REGISTER",
      newData: JSON.stringify(user),
      section: "REGISTER",
    });

    response.status(201).json({
      message: `Profile created successfully. A verification email has been sent to ${emailAddress} to verify your account. Please check your email for verification details and also check  your spam mail if you can't find it in your inbox.`,
      data: user.id,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const loginUser: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { emailAddress, password } = request.body;

    const user = await findUserByEmail(emailAddress);

    if (!user?.password) {
      const error = new Error("Password is not correct.") as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const userPassword = await compareSecretValues(password, user.password);

    if (!userPassword) {
      const error = new Error("Password is not correct.") as ResponseError;
      error.statusCode = 403;
      return next(error);
    }

    const accountStatus = await checkUserAccountStatus(user.status);
    if (accountStatus.status !== 200) {
      const error = new Error(accountStatus.message) as ResponseError;
      error.statusCode = accountStatus.status;
      return next(error);
    }

    if (user.emailVerified === VERIFICATION.NOT_VERIFIED) {
      if (!user?.emailAddress || !user?.id) {
        const error = new Error(
          "Something went wrong. Please try again later.",
        ) as ResponseError;
        error.statusCode = 404;
        return next(error);
      }

      const token = await generateEmailToken(user);

      response.status(201).json({
        data: { id: user.id },
        message: `An email verification link has been sent to ${user.emailAddress}. Please  check  your spam mail if you can't find it in your inbox.`,
      });

      return sendSingleMail({
        from: MAIL_CONFIG.sender,
        to: user.emailAddress,
        subject: `Verify your email address`,
        template: "newToken.views",
        context: {
          name: user.firstName,
          token,
        },
      });
    }

    const token = await generateAuthToken(user);

    response.status(201).json({
      message: "Login successful",
      data: { token },
    });

    const settings = await getNotificationSettingsByUserId(user?.id ?? "");

    if (!settings?.login) {
      return;
    }

    sendSingleMail({
      from: MAIL_CONFIG.sender,
      to: emailAddress,
      subject: `Login successful`,
      template: "login.views",
      context: {
        name: user.firstName,
        time: moment().format("DD/MM/YYYY HH:mm:ss"),
      },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const verifyEmail: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { id, token } = request.body;

    const user = await findUserByIdAndActiveToken(id, token);

    if (!user) {
      const error = new Error(
        "Token not found. Please try again or request a new token.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const minutes = getTokenExpiryTime(user);

    if (minutes > 5) {
      const error = new Error(
        "Token expired. Please request a new token.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    await verifyUserEmailByToken(user);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "VERIFY EMAIL",
      newData: JSON.stringify(user),
      section: "REGISTRATION",
    });

    const newNotification = `We're excited to have you join our learning community. You're now one step closer to gaining new skills and achieving your goals. Get started by exploring your dashboard, choosing a lesson that interests you, and beginning your learning journey today. If you ever need help, we're here to support you every step of the way. Happy learning!`;

    await createNotification("Welcome!!!", newNotification, user?.id ?? "");

    await createAuditLog({
      user: JSON.stringify(user),
      action: "NEW NOTIFICATION",
      newData: JSON.stringify({
        title: "Welcome!!!",
        message: newNotification,
        receiverId: user,
        senderId: null,
      }),
      section: "NOTIFICATION",
    });

    response.status(201).json({
      message: `Hi ${user.firstName}, your email is verified successfully. Please log in to continue`,
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const forgotPassword: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { emailAddress } = request.body;

    const user = await findUserByEmail(emailAddress);

    if (!user?.emailAddress) {
      const error = new Error("Email does not exist.") as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const accountStatus = await checkUserAccountStatus(user.status);
    if (accountStatus.status !== 200) {
      const error = new Error(accountStatus.message) as ResponseError;
      error.statusCode = accountStatus.status;
      return next(error);
    }

    const emailVerificationStatus = await checkUserEmailVerificationStatus(
      user.emailVerified,
    );
    if (emailVerificationStatus.status !== 200) {
      const error = new Error(emailVerificationStatus.message) as ResponseError;
      error.statusCode = emailVerificationStatus.status;
      return next(error);
    }

    const updateUser = await forgotUserPassword(user);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "FORGOT PASSWORD",
      newData: JSON.stringify(updateUser),
      section: "PASSWORD",
    });

    response.status(201).json({
      message: `A password reset email has been sent to ${emailAddress}. Please  check  your spam mail if you can't find it in your inbox.`,
      data: user.id,
    });

    sendSingleMail({
      from: MAIL_CONFIG.sender,
      to: emailAddress,
      subject: `Forgot password`,
      template: "forgotPassword.views",
      context: {
        name: user.firstName,
        token: updateUser.token,
      },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const resetPassword: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const { id, token, password } = request.body;

    const user = await findUserByIdAndActiveToken(id, token);

    if (!user) {
      const error = new Error(
        "User not found. Please try again or request a new email link.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const minutes = getTokenExpiryTime(user);

    if (minutes > 5) {
      return response.status(400).json({
        message: "Email link expired. Please request a new email link.",
      });
    }

    await resetUserPassword(user, password);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "RESET PASSWORD",
      newData: JSON.stringify(user),
      section: "PASSWORD",
    });

    response.status(201).json({
      message: "Password reset successful. Please login to continue.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const resendToken: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    if (!request.params?.id) {
      const error = new Error(
        "Something went wrong. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    const user = await findUserById(request.params.id, false);

    if (!user?.emailAddress || !user?.id) {
      const error = new Error(
        "Something went wrong. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (user?.tokenExpiryStatus !== USER.ACTIVE) {
      const error = new Error(
        "You do not have an active request that needs a token.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const token = await generateEmailToken(user);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "RESEND_TOKEN",
      newData: JSON.stringify(token),
      section: "RESEND_TOKEN",
    });

    response.status(201).json({
      message: `A token has been sent to ${user.emailAddress}. Please  check  your spam mail if you can't find it in your inbox.`,
    });

    sendSingleMail({
      from: MAIL_CONFIG.sender,
      to: user.emailAddress,
      subject: `Verify your email address`,
      template: "newToken.views",
      context: {
        name: user.firstName,
        token,
      },
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

export const logoutUser: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const token = request.header("Authorization")
      ? request.header("Authorization")?.split(" ")[1]
      : null;

    if (!token) {
      return response.status(201).json({
        message: "Logout successful.",
      });
    }

    const checkIfBlacklisted = await findExpiredTokenById(token);

    if (checkIfBlacklisted) {
      return response.status(201).json({
        message: "Logout successful.",
      });
    }

    await createBlackListToken(token);

    response.status(201).json({
      message: "Logout successful.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

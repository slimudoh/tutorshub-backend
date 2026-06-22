import { RequestHandler, Request, Response, NextFunction } from "express";
import { USER, VERIFICATION, MAIL_CONFIG, APP_NAME } from "../utils/constant";
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
import { createServerError, makeError } from "../services/error.services";
import { createAuditLog } from "../services/auditLog.services";
import { createNotification } from "../services/notification.services";
import {
  createUserSubscription,
  findFreePlan,
} from "../services/pricing.services";
import moment from "moment";

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

    const plan = await findFreePlan();

    if (plan?.id) {
      const subscription = await createUserSubscription(user, plan, true);

      await Promise.all([
        createAuditLog({
          user: JSON.stringify(user),
          action: "CREATE USER SUBSCRIPTION",
          newData: JSON.stringify(subscription),
          section: "SUBSCRIPTION",
        }),
        createAuditLog({
          user: JSON.stringify(user),
          action: "REGISTER",
          newData: JSON.stringify(user),
          section: "REGISTER",
        }),
      ]);
    } else {
      await createAuditLog({
        user: JSON.stringify(user),
        action: "REGISTER",
        newData: JSON.stringify(user),
        section: "REGISTER",
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

    response.status(201).json({
      message: `Profile created successfully. A verification email has been sent to ${emailAddress} to verify your account. Please check your email for verification details and also check your spam folder if you can't find it in your inbox.`,
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
      return next(makeError("Invalid email or password.", 401));
    }

    const isPasswordValid = await compareSecretValues(password, user.password);
    if (!isPasswordValid) {
      return next(makeError("Invalid email or password.", 401));
    }

    const accountStatus = checkUserAccountStatus(user.status);
    if (accountStatus.status !== 200) {
      return next(makeError(accountStatus.message, accountStatus.status));
    }

    if (user.emailVerified === VERIFICATION.NOT_VERIFIED) {
      const token = await generateEmailToken(user);

      await sendSingleMail({
        from: MAIL_CONFIG.sender,
        to: user?.emailAddress ?? "",
        subject: "Verify your email address",
        template: "newToken.views",
        context: { name: user.firstName, token },
      });

      return response.status(200).json({
        data: { id: user.id },
        message: `An email verification link has been sent to ${user.emailAddress}. Please check your spam folder if you can't find it in your inbox.`,
      });
    }

    const token = await generateAuthToken(user);

    response.status(200).json({
      message: "Login successful.",
      data: { token },
    });

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
    if (!user?.id) {
      return next(
        makeError(
          "Token not found. Please try again or request a new token.",
          400,
        ),
      );
    }

    if (getTokenExpiryTime(user) > 5) {
      return next(makeError("Token expired. Please request a new token.", 400));
    }

    await verifyUserEmailByToken(user);

    const notificationMessage =
      "We're excited to have you join our learning community. You're now one step closer to gaining new skills and achieving your goals. Get started by exploring your dashboard, choosing a lesson that interests you, and beginning your learning journey today. If you ever need help, we're here to support you every step of the way. Happy learning!";

    await Promise.all([
      createNotification("Welcome!!!", notificationMessage, user.id),
      createAuditLog({
        user: JSON.stringify(user),
        action: "VERIFY EMAIL",
        newData: JSON.stringify(user),
        section: "REGISTRATION",
      }),
    ]);

    response.status(200).json({
      message: `Hi ${user.firstName}, your email has been verified successfully. Please log in to continue.`,
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
      return next(makeError("Email does not exist.", 404));
    }

    const accountStatus = checkUserAccountStatus(user.status);
    if (accountStatus.status !== 200) {
      return next(makeError(accountStatus.message, accountStatus.status));
    }

    const emailVerificationStatus = checkUserEmailVerificationStatus(
      user.emailVerified,
    );
    if (emailVerificationStatus.status !== 200) {
      return next(
        makeError(
          emailVerificationStatus.message,
          emailVerificationStatus.status,
        ),
      );
    }

    const updatedUser = await forgotUserPassword(user);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "FORGOT PASSWORD",
      newData: JSON.stringify(updatedUser),
      section: "PASSWORD",
    });

    response.status(200).json({
      message: `A password reset email has been sent to ${emailAddress}. Please check your spam folder if you can't find it in your inbox.`,
      data: user.id,
    });

    sendSingleMail({
      from: MAIL_CONFIG.sender,
      to: emailAddress,
      subject: `Forgot password`,
      template: "forgotPassword.views",
      context: {
        name: user.firstName,
        token: updatedUser.token,
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
      return next(
        makeError(
          "User not found. Please try again or request a new email link.",
          400,
        ),
      );
    }

    if (getTokenExpiryTime(user) > 5) {
      return next(
        makeError("Email link expired. Please request a new email link.", 400),
      );
    }

    await resetUserPassword(user, password);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "RESET PASSWORD",
      newData: JSON.stringify(user),
      section: "PASSWORD",
    });

    response.status(200).json({
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
    const user = await findUserById(request.params.id, false);

    if (!user?.emailAddress) {
      return next(
        makeError("Something went wrong. Please try again later.", 404),
      );
    }

    if (user.tokenExpiryStatus !== USER.ACTIVE) {
      return next(
        makeError("You do not have an active request that needs a token.", 400),
      );
    }

    const token = await generateEmailToken(user);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "RESEND_TOKEN",
      newData: JSON.stringify(token),
      section: "RESEND_TOKEN",
    });

    response.status(200).json({
      message: `A token has been sent to ${user.emailAddress}. Please check your spam folder if you can't find it in your inbox.`,
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
    const token = request.header("Authorization")?.split(" ")[1] ?? null;

    if (!token) {
      return response.status(200).json({ message: "Logout successful." });
    }

    const isBlacklisted = await findExpiredTokenById(token);
    if (isBlacklisted) {
      return response.status(200).json({ message: "Logout successful." });
    }

    await createBlackListToken(token);

    response.status(200).json({ message: "Logout successful." });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

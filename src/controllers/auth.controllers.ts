import { RequestHandler, Request, Response, NextFunction } from "express";
import {
  STATUS,
  VERIFICATION,
  MAIL_CONFIG,
  APP_URL,
  APP_NAME,
} from "../utils/constant";
import { Options } from "nodemailer/lib/mailer";
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
import { sendMail } from "../services/email.services";
import {
  createBlackListToken,
  findExpiredTokenById,
  generateAuthToken,
  generateEmailToken,
} from "../services/auth.services";
import { createServerError } from "../services/error.services";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";
import { createAuditLog } from "../services/auditLog.services";
import { getNotificationSettingsByUserId } from "../services/setting.services";
import moment from "moment";
import { createMessage } from "../services/message.services";

type ExtendedOptions = Options & {
  template: string;
  context: Record<string, unknown>;
};

interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export const registerUser: RequestHandler = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const {
      firstName,
      lastName,
      emailAddress,
      phoneCode,
      phoneNumber,
      password,
    } = request.body;

    const user = await createUser(
      firstName,
      lastName,
      emailAddress,
      phoneCode,
      phoneNumber,
      password,
    );

    const options: ExtendedOptions = {
      from: MAIL_CONFIG.sender,
      to: emailAddress,
      subject: `Message from ${APP_NAME}`,
      template: "register.views",
      context: {
        name: user.firstName,
        token: user.token,
        appName: APP_NAME,
        year: new Date().getFullYear(),
      },
    };

    sendMail(options);

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
      if (!user?.emailAddress) {
        const error = new Error(
          "Something went wrong. Please try again later.",
        ) as ResponseError;
        error.statusCode = 404;
        return next(error);
      }

      const updatedUser = await generateEmailToken(user);

      response.status(201).json({
        data: { id: updatedUser.id },
        message: `An email verification link has been sent to ${updatedUser.emailAddress}. Please  check  your spam mail if you can't find it in your inbox.`,
      });

      const options: ExtendedOptions = {
        from: MAIL_CONFIG.sender,
        to: user.emailAddress,
        subject: `Message from ${APP_NAME}`,
        template: "newToken.views",
        context: {
          name: user.firstName,
          link: `${APP_URL}/email-verification/${updatedUser.token}`,
          year: new Date().getFullYear(),
        },
      };

      return sendMail(options);
    }

    const token = await generateAuthToken(user);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "LOGIN",
      newData: JSON.stringify({
        ip: request.ip,
        userAgent: request.headers["user-agent"],
      }),
      section: "LOGIN",
    });

    response.status(201).json({
      message: "Login successful",
      data: { token },
    });

    const settings = await getNotificationSettingsByUserId(user?.id ?? "");

    if (!settings?.login) {
      return;
    }

    const options: ExtendedOptions = {
      from: MAIL_CONFIG.sender,
      to: emailAddress,
      subject: `Message from ${APP_NAME}`,
      template: "login.views",
      context: {
        name: user.firstName,
        time: moment().format("DD/MM/YYYY HH:mm:ss"),
        year: new Date().getFullYear(),
      },
    };

    sendMail(options);
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
      action: "VERIFY_EMAIL",
      newData: JSON.stringify(user),
      section: "VERIFY_EMAIL",
    });

    const newMessage = `
   <p> We're excited to have you join our learning community. You're now one step closer to gaining new skills and achieving your goals.</p>

   <p>Get started by exploring your dashboard, choosing a course that interests you, and beginning your learning journey today.</p>
   <p>If you ever need help, we're here to support you every step of the way.</p>

   <p>Happy learning!</p>
    
    `;

    await createMessage("Welcome!!!", newMessage, user?.id ?? "");

    await createAuditLog({
      user: JSON.stringify(user),
      action: "NEW MESSAGE",
      newData: JSON.stringify({
        title: "Welcome!!!",
        message: newMessage,
        receiverId: user,
        senderId: null,
      }),
      section: "MESSAGE",
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
      action: "FORGOT_PASSWORD",
      newData: JSON.stringify(updateUser),
      section: "FORGOT_PASSWORD",
    });

    response.status(201).json({
      message: `A password reset email has been sent to ${emailAddress}. Please  check  your spam mail if you can't find it in your inbox.`,
      data: user.id,
    });

    const options: ExtendedOptions = {
      from: MAIL_CONFIG.sender,
      to: emailAddress,
      subject: `Message from ${APP_NAME}`,
      template: "forgotPassword.views",
      context: {
        name: user.firstName,
        token: updateUser.token,
        year: new Date().getFullYear(),
      },
    };

    sendMail(options);
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
      action: "RESET_PASSWORD",
      newData: JSON.stringify(user),
      section: "RESET_PASSWORD",
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

    if (!user?.emailAddress) {
      const error = new Error(
        "Something went wrong. Please try again later.",
      ) as ResponseError;
      error.statusCode = 404;
      return next(error);
    }

    if (user?.tokenExpiryStatus !== STATUS.ACTIVE) {
      const error = new Error(
        "You do not have an active request that needs a token.",
      ) as ResponseError;
      error.statusCode = 400;
      return next(error);
    }

    const updatedUser = await generateEmailToken(user);

    await createAuditLog({
      user: JSON.stringify(user),
      action: "RESEND_TOKEN",
      newData: JSON.stringify(updatedUser),
      section: "RESEND_TOKEN",
    });

    response.status(201).json({
      message: `A token has been sent to ${user.emailAddress}. Please  check  your spam mail if you can't find it in your inbox.`,
    });

    const options: ExtendedOptions = {
      from: MAIL_CONFIG.sender,
      to: user.emailAddress,
      subject: `Message from ${APP_NAME}`,
      template: "newToken.views",
      context: {
        name: user.firstName,
        token: updatedUser.token,
        year: new Date().getFullYear(),
      },
    };

    sendMail(options);
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
    const userId = (request as CustomRequest).user?.id;

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

    const user = await findUserById(userId);

    if (user) {
      await createAuditLog({
        user: JSON.stringify(user),
        action: "LOGOUT",
        newData: JSON.stringify({
          ip: request.ip,
          userAgent: request.headers["user-agent"],
        }),
        section: "LOGOUT",
      });
    }

    response.status(201).json({
      message: "Logout successful.",
    });
  } catch (err) {
    const error = createServerError(err as Error, 500);
    next(error);
  }
};

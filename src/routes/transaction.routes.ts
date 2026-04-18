import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isAdmin from "../middlewares/admin.middlewares";
import {
  getUserPayments,
  getAdminEarnings,
  getAdminPayouts,
  getAdminPayments,
  getUserEarnings,
  getUserPayouts,
} from "../controllers/transaction.controllers";
import isUser from "../middlewares/user.middlewares";

const router = Router();

router.get("/admin-earnings", isAuth, isAdmin, getAdminEarnings);

router.get("/admin-payouts", isAuth, isAdmin, getAdminPayouts);

router.get("/admin-payments", isAuth, isAdmin, getAdminPayments);

router.get("/user-earnings", isAuth, isUser, getUserEarnings);

router.get("/user-payouts", isAuth, isUser, getUserPayouts);

router.get("/user-payments", isAuth, isUser, getUserPayments);

export default router;

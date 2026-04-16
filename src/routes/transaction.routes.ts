import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isAdmin from "../middlewares/admin.middlewares";
import {
  getAllTransactions,
  getUserPayments,
} from "../controllers/transaction.controllers";
import isUser from "../middlewares/user.middlewares";

const router = Router();

router.get("/", isAuth, isAdmin, getAllTransactions);

router.get("/user-payments", isAuth, isUser, getUserPayments);

export default router;

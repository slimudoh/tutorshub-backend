import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isAdmin from "../middlewares/admin.middlewares";
import {
  getPayments,
  getEarnings,
  getPayouts,
  getAllTransactions,
  getTransactionDetails,
} from "../controllers/transaction.controllers";
import isUser from "../middlewares/user.middlewares";

const router = Router();

router.get("/", isAuth, isAdmin, getAllTransactions);

router.get("/earnings", isAuth, isUser, getEarnings);

router.get("/payouts", isAuth, isUser, getPayouts);

router.get("/payments", isAuth, isUser, getPayments);

router.get("/:id", isAuth, isUser, getTransactionDetails);

export default router;

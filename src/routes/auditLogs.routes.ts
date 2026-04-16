import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isAdmin from "../middlewares/admin.middlewares";
import { getAllAuditLogs } from "../controllers/auditLog.controllers";

const router = Router();

router.get("/", isAuth, isAdmin, getAllAuditLogs);

export default router;

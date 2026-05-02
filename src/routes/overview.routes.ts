import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isAdmin from "../middlewares/admin.middlewares";
import isInstructor from "../middlewares/instructor.middlewares";
import {
  getAdminOverview,
  getInstructorOverview,
} from "../controllers/overview.controllers";

const router = Router();

router.get("/admin-overview", isAuth, isAdmin, getAdminOverview);

router.get("/instructor-overview", isAuth, isInstructor, getInstructorOverview);

export default router;

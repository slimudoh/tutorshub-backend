import { Router } from "express";
import {
  getAllActiveLessons,
  getAllUserLessons,
  getAllLessons,
  reviewAdminLessons,
  getLiveLessons,
  getLessonHistory,
  getHomeLessons,
  getLessonsByCategory,
  getAllInstructorLessons,
  submitNewLesson,
  submitUpdatedLesson,
  getLesson,
  reviewInstructorLessons,
  getLessonsByInstructor,
  lessonEnrollment,
  cancelEnrollment,
  lessonJoinRoom,
  lessonLeaveRoom,
} from "../controllers/lesson.controllers";
import isAuth from "../middlewares/auth.middlewares";
import isAdmin from "../middlewares/admin.middlewares";
import isUser from "../middlewares/user.middlewares";
import { check } from "express-validator";
import Validate from "../middlewares/validate.middlewares";
import isInstructor from "../middlewares/instructor.middlewares";
import { imageUpload } from "../utils/file";

const router = Router();

router.get("/", getAllActiveLessons);

router.get("/categories/:slug", getLessonsByCategory);

router.get("/instructors/:id", getLessonsByInstructor);

router.get("/live", getLiveLessons);

router.get("/admin", isAuth, isAdmin, getAllLessons);

router.get("/users", isAuth, isUser, getAllUserLessons);

router.get("/users/all-lessons", isAuth, isInstructor, getAllInstructorLessons);

router.get("/histories", isAuth, isUser, getLessonHistory);

router.get("/home-lessons", getHomeLessons);

router.patch(
  "/review-admin-lessons",
  check("id").notEmpty().withMessage("ID is required."),
  check("status").notEmpty().withMessage("Status is required."),
  Validate,
  isAuth,
  isAdmin,
  reviewAdminLessons,
);

router.patch(
  "/review-instructor-lessons",
  check("id").notEmpty().withMessage("ID is required."),
  check("status").notEmpty().withMessage("Status is required."),
  Validate,
  isAuth,
  isInstructor,
  reviewInstructorLessons,
);

router.post(
  "/",
  imageUpload.single("file"),
  check("title").notEmpty().withMessage("Title is required."),
  check("category").notEmpty().withMessage("Category is required."),
  check("level").notEmpty().withMessage("Level is required."),
  check("language").notEmpty().withMessage("Language is required."),
  check("duration").notEmpty().withMessage("Duration is required."),
  check("lessonDate").notEmpty().withMessage("Lesson Date is required."),
  check("startTime").notEmpty().withMessage("Start Time is required."),
  check("endTime").notEmpty().withMessage("End Time is required."),
  check("lateJoinMinutes")
    .notEmpty()
    .withMessage("Late Join Minutes is required."),
  check("participants").notEmpty().withMessage("Participants is required."),
  check("description").notEmpty().withMessage("Description is required."),
  check("freeLesson").notEmpty().withMessage("Free lesson is required."),
  check("lectures").notEmpty().withMessage("Lectures is required."),
  check("seoTitle").notEmpty().withMessage("SEO title is required."),
  check("seoDescription")
    .notEmpty()
    .withMessage("SEO description is required."),
  check("seoTags").notEmpty().withMessage("SEO tags is required."),
  Validate,
  isAuth,
  isInstructor,
  submitNewLesson,
);

router.patch(
  "/",
  imageUpload.single("file"),
  check("title").notEmpty().withMessage("Title is required."),
  check("category").notEmpty().withMessage("Category is required."),
  check("level").notEmpty().withMessage("Level is required."),
  check("language").notEmpty().withMessage("Language is required."),
  check("duration").notEmpty().withMessage("Duration is required."),
  check("lessonDate").notEmpty().withMessage("Lesson Date is required."),
  check("startTime").notEmpty().withMessage("Start Time is required."),
  check("endTime").notEmpty().withMessage("End Time is required."),
  check("lateJoinMinutes")
    .notEmpty()
    .withMessage("Late Join Minutes is required."),
  check("participants").notEmpty().withMessage("Participants is required."),
  check("description").notEmpty().withMessage("Description is required."),
  check("freeLesson").notEmpty().withMessage("Free lesson is required."),
  check("lectures").notEmpty().withMessage("Lectures is required."),
  check("seoTitle").notEmpty().withMessage("SEO title is required."),
  check("seoDescription")
    .notEmpty()
    .withMessage("SEO description is required."),
  check("seoTags").notEmpty().withMessage("SEO tags is required."),
  Validate,
  isAuth,
  isInstructor,
  submitUpdatedLesson,
);

router.put("/lesson-enrollment/:id", isAuth, isUser, lessonEnrollment);

router.delete("/lesson-enrollment/:id", isAuth, isUser, cancelEnrollment);

router.put("/lesson-join-room/:id", isAuth, isUser, lessonJoinRoom);

router.delete("/lesson-leave-room/:id", isAuth, isUser, lessonLeaveRoom);

router.get("/:id", getLesson);

export default router;

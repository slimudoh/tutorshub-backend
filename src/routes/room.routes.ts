import { Router } from "express";
import isAuth from "../middlewares/auth.middlewares";
import isUser from "../middlewares/user.middlewares";
import {
  joinLessonLectureRoom,
  leaveLessonLectureRoom,
  exportLessonRoomChat,
  exportLessonRoomTranscripts,
  activateLessonLectureRoom,
} from "../controllers/room.controllers";

const router = Router();

router.put("/lesson-join-room/:id", isAuth, isUser, joinLessonLectureRoom);

router.put(
  "/lesson-activate-room/:id",
  isAuth,
  isUser,
  activateLessonLectureRoom,
);

router.delete("/lesson-leave-room/:id", isAuth, isUser, leaveLessonLectureRoom);

router.get("/lesson-chat-export/:roomId", isAuth, isUser, exportLessonRoomChat);

router.get(
  "/lesson-transcripts-export/:roomId",
  isAuth,
  isUser,
  exportLessonRoomTranscripts,
);

export default router;

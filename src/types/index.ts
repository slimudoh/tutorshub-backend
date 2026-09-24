import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { Users } from "../interfaces/user";

export type UserProfileData = {
  avatar: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneCode: string;
  phoneNumber: string;
  profession: string;
  userName: string;
  dateOfBirth: string;
  country: string;
  address: string;
  role: string;
};

export type UpdateUserProfileData = Partial<{
  avatar: string | null;
  firstName: string;
  lastName: string;
  phoneCode: string;
  phoneNumber: string;
  profession: string;
  userName: string;
  dateOfBirth: string;
  address: string;
  country: string;
}>;

export interface IJwtPayload extends JwtPayload {
  id: string;
  role: string;
}

export interface CustomRequest extends Request {
  user: Users | JwtPayload;
}

export interface AddLessonLectureInterface {
  userId: string;
  slug: string;
  title: string;
  category: string;
  level: string;
  language: string;
  duration: string;
  lateJoinMinutes: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  participants: number;
  description: string;
  freeLesson: string;
  lectures: { title: string; description: string }[];
  seoTitle: string;
  seoDescription: string;
  seoTags: string;
  file: string | null;
}

export interface UpdateLessonLectureInterface {
  id: string;
  title: string;
  category: string;
  level: string;
  language: string;
  duration: string;
  lateJoinMinutes: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  participants: number;
  description: string;
  freeLesson: string;
  lectures: { title: string; description: string }[];
  seoTitle: string;
  seoDescription: string;
  seoTags: string;
  file: string | null;
  externalRoomId: string;
  slug: string;
}

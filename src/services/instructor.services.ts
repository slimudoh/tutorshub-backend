import { Op } from "@sequelize/core";
import Instructor from "../models/instructor.models";
import {
  INSTRUCTOR_EXCLUDED_ATTRIBUTES,
  USER_EXCLUDED_ATTRIBUTES,
} from "../utils/constant";
import User from "../models/user.models";

export const createNewInstructor = async (
  userId: string,
  bio: string,
  languages: string[],
  skills: string[],
  status: string,
) => {
  return await Instructor.create({
    id: crypto.randomUUID(),
    userId,
    bio,
    languages: JSON.stringify(languages),
    skills: JSON.stringify(skills),
    status,
  });
};

export const updateInstructorProfile = async (
  userId: string,
  bio: string,
  languages: string[],
  skills: string[],
) => {
  return await Instructor.update(
    {
      bio,
      languages: JSON.stringify(languages),
      skills: JSON.stringify(skills),
    },
    { where: { userId } },
  );
};

export const findInstructorByUserId = async (userId: string) => {
  return await Instructor.findOne({
    where: { userId },
  });
};

export const getAllInstructors = async (
  keyword: string,
  status: string,
  offsetSize?: number,
  newPageSize?: number,
  excludeAttributes = true,
) => {
  let where = {};

  if (keyword) {
    where = {
      [Op.or]: [
        { skills: { [Op.like]: `%${keyword}%` } },
        { languages: { [Op.like]: `%${keyword}%` } },
        { bio: { [Op.like]: `%${keyword}%` } },
      ],
    };
  }

  if (status) {
    where = {
      ...where,
      status,
    };
  }

  if (!offsetSize && !newPageSize) {
    return await Instructor.count({ where });
  }

  const instructors = await Instructor.findAll({
    where,
    order: [["createdAt", "DESC"]],
    ...(offsetSize && { offset: offsetSize }),
    ...(newPageSize && { limit: newPageSize }),
    ...(excludeAttributes && {
      attributes: {
        exclude: INSTRUCTOR_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });

  const users = await User.findAll({
    where: {
      id: {
        [Op.in]: instructors.map((instructor) => instructor.userId),
      },
    },
    attributes: {
      exclude: USER_EXCLUDED_ATTRIBUTES,
    },
  });

  instructors.forEach((instructor: Instructor) => {
    const user = users.find((user) => user.id === instructor.userId);
    instructor.user = user || null;
  });

  return instructors;
};

export const getInstructorById = async (
  id: string,
  excludeAttributes = true,
) => {
  return await Instructor.findOne({
    where: {
      id: id,
    },
    ...(excludeAttributes && {
      attributes: {
        exclude: INSTRUCTOR_EXCLUDED_ATTRIBUTES,
      },
    }),
    raw: true,
  });
};

export const updateInstructorStatus = async (id: string, status: string) => {
  await Instructor.update({ status }, { where: { id } });
};

import { z } from "zod";

/** A class as the API exposes it, with the queue counts the teacher sees. */
export const classDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  subjectId: z.uuid(),
  subjectName: z.string(),
  joinCode: z.string().length(6),
  capacity: z.number().int().positive().nullable(),
  activeCount: z.number().int(),
  waitlistedCount: z.number().int(),
  teacherNames: z.array(z.string()),
  createdAt: z.string(),
});
export type ClassDto = z.infer<typeof classDtoSchema>;

/** What an admin sends to create a class. The subject defaults on the server. */
export const createClassSchema = z.object({
  name: z.string().trim().min(1).max(200),
  teacherId: z.uuid(),
  capacity: z.number().int().min(1).nullable().optional(),
});
export type CreateClassInput = z.infer<typeof createClassSchema>;

/** One entry in a person's class list, carrying their own enrollment status. */
export const myClassDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  joinCode: z.string().length(6),
  subjectName: z.string(),
  capacity: z.number().int().positive().nullable(),
  activeCount: z.number().int(),
  waitlistedCount: z.number().int(),
  teacherNames: z.array(z.string()),
  status: z.enum(["active", "waitlisted"]).nullable(),
  joinedAt: z.string().nullable(),
});
export type MyClassDto = z.infer<typeof myClassDtoSchema>;

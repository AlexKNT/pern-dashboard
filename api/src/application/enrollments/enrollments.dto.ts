import { z } from "zod";

/** One enrollment as the API exposes it. */
export const enrollmentDtoSchema = z.object({
  id: z.uuid(),
  classId: z.uuid(),
  studentId: z.uuid(),
  status: z.enum(["active", "waitlisted", "left"]),
  joinedAt: z.string(),
});
export type EnrollmentDto = z.infer<typeof enrollmentDtoSchema>;

/** What a student sends to join a class with its code. */
export const joinClassSchema = z.object({
  code: z.string().trim().min(1).max(20),
});
export type JoinClassInput = z.infer<typeof joinClassSchema>;

/** The pagination for a roster read. */
export const rosterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type RosterQuery = z.infer<typeof rosterQuerySchema>;

/** One student on a roster. */
export const rosterEntryDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string().email(),
  joinedAt: z.string(),
});
export type RosterEntryDto = z.infer<typeof rosterEntryDtoSchema>;

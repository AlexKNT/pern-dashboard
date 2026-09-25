import { z } from "zod";

/** A user account as the API exposes it. */
export const userDtoSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "teacher", "student"]),
});
export type UserDto = z.infer<typeof userDtoSchema>;

/** What an admin sends to create a teacher or another admin account. */
export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["admin", "teacher"]),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

/** The query for listing users, narrowed to one role. */
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

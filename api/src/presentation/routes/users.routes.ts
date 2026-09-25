import { makeUsersController } from "../controllers/users.controller.js";
import { defineRoutes } from "../http/route.js";
import {
  createUserSchema,
  listUsersQuerySchema,
  userDtoSchema,
} from "../../application/users/users.dto.js";
import type { UsersService } from "../../application/users/users.service.js";

/**
 * The users routes: an admin creates a teacher or admin account, and lists
 * teachers for the create class picker.
 */
export function makeUsersRouter(service: UsersService) {
  const router = defineRoutes("/api/v1/users");
  const controller = makeUsersController(service);

  router.post(
    "/",
    {
      summary: "Create a teacher or admin account",
      body: createUserSchema,
      response: userDtoSchema,
      auth: ["admin"],
      status: 201,
    },
    controller.createUser,
  );

  router.list(
    "get",
    "/",
    {
      summary: "List teachers",
      query: listUsersQuerySchema,
      item: userDtoSchema,
      auth: ["admin"],
    },
    controller.listTeachers,
  );

  return router.build();
}

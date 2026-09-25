import { makeClassesController } from "../controllers/classes.controller.js";
import { defineRoutes } from "../http/route.js";
import { myClassDtoSchema } from "../../application/classes/classes.dto.js";
import { listQuery } from "../../application/shared/list.js";
import type { ClassesService } from "../../application/classes/classes.service.js";

/**
 * The current user's class list, for the my classes screen. Each role sees the
 * classes it relates to, and a student also sees its own enrollment status.
 */
export function makeMeRouter(service: ClassesService) {
  const router = defineRoutes("/api/v1/me");
  const controller = makeClassesController(service);

  router.list(
    "get",
    "/classes",
    {
      summary: "List my classes",
      query: listQuery(["name", "created_at"]),
      item: myClassDtoSchema,
      auth: ["admin", "teacher", "student"],
    },
    controller.listMyClasses,
  );

  return router.build();
}

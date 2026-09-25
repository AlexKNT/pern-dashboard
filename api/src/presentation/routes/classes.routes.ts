import { makeClassesController } from "../controllers/classes.controller.js";
import { defineRoutes } from "../http/route.js";
import { classDtoSchema, createClassSchema } from "../../application/classes/classes.dto.js";
import type { ClassesService } from "../../application/classes/classes.service.js";

/**
 * The class creation route. Join, leave and the roster live in the enrollments
 * router, which shares the `/api/v1/classes` prefix.
 */
export function makeClassesRouter(service: ClassesService) {
  const router = defineRoutes("/api/v1/classes");
  const controller = makeClassesController(service);

  router.post(
    "/",
    {
      summary: "Create a class with a teacher, capacity and join code",
      body: createClassSchema,
      response: classDtoSchema,
      auth: ["admin"],
      status: 201,
    },
    controller.createClass,
  );

  return router.build();
}

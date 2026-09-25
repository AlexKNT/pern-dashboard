import { z } from "zod";

import { makeEnrollmentsController } from "../controllers/enrollments.controller.js";
import { defineRoutes } from "../http/route.js";
import {
  enrollmentDtoSchema,
  joinClassSchema,
  rosterEntryDtoSchema,
  rosterQuerySchema,
} from "../../application/enrollments/enrollments.dto.js";
import type { EnrollmentsService } from "../../application/enrollments/enrollments.service.js";

const classIdParams = z.object({ id: z.uuid() });

/**
 * The enrollment routes: a student joins by code or leaves a class, and the
 * roster is read by the class's teachers and admins.
 */
export function makeEnrollmentsRouter(service: EnrollmentsService) {
  const router = defineRoutes("/api/v1/classes");
  const controller = makeEnrollmentsController(service);

  router.post(
    "/join",
    {
      summary: "Join a class with its code",
      body: joinClassSchema,
      response: enrollmentDtoSchema,
      auth: ["student"],
    },
    controller.join,
  );

  router.post(
    "/:id/leave",
    {
      summary: "Leave a class",
      params: classIdParams,
      response: enrollmentDtoSchema,
      auth: ["student"],
    },
    controller.leave,
  );

  router.list(
    "get",
    "/:id/roster",
    {
      summary: "Read a class roster",
      params: classIdParams,
      query: rosterQuerySchema,
      item: rosterEntryDtoSchema,
      auth: ["admin", "teacher"],
    },
    controller.roster,
  );

  return router.build();
}

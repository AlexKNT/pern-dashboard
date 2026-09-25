import { makeClassesService } from "./application/classes/classes.service.js";
import { makeEnrollmentsService } from "./application/enrollments/enrollments.service.js";
import { makeUsersService } from "./application/users/users.service.js";
import { db } from "./infrastructure/db/client.js";
import { withTransaction } from "./infrastructure/db/transaction.js";
import { makeClassesRepository } from "./infrastructure/repositories/classes.repository.js";
import { makeEnrollmentsRepository } from "./infrastructure/repositories/enrollments.repository.js";
import { makeUsersRepository } from "./infrastructure/repositories/users.repository.js";
import { logger } from "./infrastructure/logging.js";
import { env } from "./infrastructure/config/env.js";
import { createApp } from "./presentation/app.js";

/**
 * Composition root: build the repositories, the services over them, then the app,
 * and start listening. Everything is a plain function wired here by hand.
 */
const usersService = makeUsersService({ db, users: makeUsersRepository });
const classesService = makeClassesService({
  db,
  classes: makeClassesRepository,
  users: makeUsersRepository,
  withTransaction,
});
const enrollmentsService = makeEnrollmentsService({
  db,
  classes: makeClassesRepository,
  enrollments: makeEnrollmentsRepository,
  withTransaction,
});

const app = createApp({
  users: usersService,
  classes: classesService,
  enrollments: enrollmentsService,
});

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, "API listening");
});

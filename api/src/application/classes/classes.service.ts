import { generateJoinCode } from "../../domain/join-code.js";
import { AppError, NotFoundError, isUniqueViolation } from "../errors.js";
import type { AuthUser } from "../identity/identity.js";
import type { ListQuery } from "../shared/list.js";
import type { ClassDto, CreateClassInput, MyClassDto } from "./classes.dto.js";
import type { ClassesRepository, ClassRow, MyClassRow } from "./classes.repository.js";
import type { UsersRepository } from "../users/users.repository.js";

const MAX_JOIN_CODE_ATTEMPTS = 5;

/** Converts a class row to the DTO, with counts and the subject name. */
function toClassDto(
  row: ClassRow,
  extras: {
    subjectName: string;
    teacherNames: string[];
    activeCount: number;
    waitlistedCount: number;
  },
): ClassDto {
  return {
    id: row.id,
    name: row.name,
    subjectId: row.subjectId,
    subjectName: extras.subjectName,
    joinCode: row.joinCode,
    capacity: row.capacity,
    activeCount: extras.activeCount,
    waitlistedCount: extras.waitlistedCount,
    teacherNames: extras.teacherNames,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Converts a class list row to the DTO. */
function toMyClassDto(row: MyClassRow): MyClassDto {
  return {
    id: row.id,
    name: row.name,
    joinCode: row.joinCode,
    subjectName: row.subjectName,
    capacity: row.capacity,
    activeCount: row.activeCount,
    waitlistedCount: row.waitlistedCount,
    teacherNames: row.teacherNames,
    status: row.status,
    joinedAt: row.joinedAt,
  };
}

/**
 * The dependencies the class use cases need, generic over the transaction handle
 * so the application layer never imports the database client or ORM.
 */
export type ClassesServiceDeps<Tx> = {
  db: Tx;
  classes: (tx: Tx) => ClassesRepository;
  users: (tx: Tx) => UsersRepository;
  withTransaction: <T>(fn: (tx: Tx) => Promise<T>) => Promise<T>;
};

/**
 * Class use cases. Creating is an admin action; listing is role aware and lists
 * the classes the caller relates to.
 */
export function makeClassesService<Tx>(deps: ClassesServiceDeps<Tx>) {
  return {
    /** Creates a class with a unique join code and the chosen teacher. */
    async createClass(_actor: AuthUser, input: CreateClassInput): Promise<ClassDto> {
      const teacher = await deps.users(deps.db).findById(input.teacherId);
      if (!teacher || teacher.role !== "teacher") throw new NotFoundError("No such teacher.");

      const subject = await deps.classes(deps.db).findDefaultSubject();
      if (!subject) {
        throw new AppError("internal", 500, "No default subject exists. Run the seed first.");
      }

      for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt += 1) {
        const joinCode = generateJoinCode();
        try {
          const row = await deps.withTransaction((tx) =>
            deps
              .classes(tx)
              .create(
                {
                  name: input.name,
                  subjectId: subject.id,
                  joinCode,
                  capacity: input.capacity ?? null,
                },
                input.teacherId,
              ),
          );
          return toClassDto(row, {
            subjectName: subject.name,
            teacherNames: [teacher.name],
            activeCount: 0,
            waitlistedCount: 0,
          });
        } catch (error) {
          if (isUniqueViolation(error) && attempt < MAX_JOIN_CODE_ATTEMPTS - 1) continue;
          throw error;
        }
      }

      throw new AppError("internal", 500, "Could not generate a unique join code.");
    },

    /** Lists the classes the caller relates to, for the my classes screen. */
    async listMyClasses(
      actor: AuthUser,
      query: ListQuery,
    ): Promise<{ items: MyClassDto[]; total: number }> {
      const { items, total } = await deps.classes(deps.db).listClassesForUser(actor, query);
      return { items: items.map(toMyClassDto), total };
    },
  };
}

/** The public surface a classes controller binds to. */
export type ClassesService = ReturnType<typeof makeClassesService>;

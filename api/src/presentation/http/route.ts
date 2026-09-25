import { Router } from "express";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodTypeAny } from "zod";
import { z } from "zod";

import { AppError, ValidationError } from "../../application/errors.js";
import type { AuthUser, Role } from "../../application/identity/identity.js";
import { requireAuth, requireRole } from "./auth.js";

type MaybePromise<T> = T | Promise<T>;
type Empty = Record<string, never>;

/** The parsed request plus the authenticated user and raw request, for a handler. */
export type RouteContext<P, Q, B> = {
  params: P;
  query: Q;
  body: B;
  user: AuthUser;
  request: Request;
  response: Response;
};

/** One route declared on the helper, with its request schemas and auth. */
export type RouteDefinition = {
  summary: string;
  auth: Role[];
  status?: number;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  body?: ZodTypeAny;
  response?: ZodTypeAny;
  item?: ZodTypeAny;
};

type SingleDefinition = RouteDefinition & { response: ZodTypeAny };
type ListDefinition = RouteDefinition & { item: ZodTypeAny };

/** The parsed value a schema produces, or an empty object when no schema exists. */
type Parsed<S> = S extends ZodTypeAny ? z.infer<S> : Empty;

type ContextOf<D extends RouteDefinition> = RouteContext<
  D extends { params: infer S } ? Parsed<S> : Empty,
  D extends { query: infer S } ? Parsed<S> : Empty,
  D extends { body: infer S } ? Parsed<S> : Empty
>;

type OutputOf<S> = S extends ZodTypeAny ? z.infer<S> : unknown;

/** Validates a request part, throwing a validation error when it does not fit. */
function parse(schema: ZodTypeAny | undefined, value: unknown): unknown {
  if (!schema) return value;
  const result = schema.safeParse(value);
  if (!result.success) throw new ValidationError(result.error.flatten());
  return result.data;
}

/** Validates the handler's return value against the response schema. */
function assert(schema: ZodTypeAny, value: unknown): unknown {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AppError("internal", 500, "The server produced an invalid response.");
  }
  return result.data;
}

type RouteHandler = (ctx: {
  params: unknown;
  query: unknown;
  body: unknown;
  user: AuthUser;
  request: Request;
  response: Response;
}) => MaybePromise<unknown>;

/**
 * The one way to declare an API route. Each route carries its method, path,
 * summary, request schemas, response or item schema, and allowed roles. The
 * helper validates the request, types the handler from the schemas, wraps the
 * returned DTO in the `{ data }` envelope (a list in `{ data, total }`), and
 * guards the route with requireAuth plus requireRole.
 */
export function defineRoutes(basePath: string) {
  const router = Router();

  function register(
    method: "get" | "post",
    path: string,
    definition: SingleDefinition | ListDefinition,
    handler: RouteHandler,
  ): void {
    const middlewares: RequestHandler[] = [requireAuth, requireRole(...definition.auth)];
    const status = definition.status ?? 200;
    const itemSchema = "item" in definition ? definition.item : undefined;
    const responseSchema = "response" in definition ? definition.response : undefined;

    const routeHandler: RequestHandler = async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const params = parse(definition.params, req.params);
        const query = parse(definition.query, { ...req.query });
        const body = parse(definition.body, req.body ?? {});
        const user = res.locals.user as AuthUser;

        const output = await handler({ params, query, body, user, request: req, response: res });

        if (itemSchema) {
          const { items, total } = output as { items: unknown[]; total: number };
          const data = items.map((item) => assert(itemSchema, item));
          res.status(status).json({ data, total });
        } else if (responseSchema) {
          const data = assert(responseSchema, output);
          res.status(status).json({ data });
        }
      } catch (error) {
        next(error);
      }
    };

    router[method](`${basePath}${path}`, ...middlewares, routeHandler);
  }

  return {
    get<D extends SingleDefinition>(
      path: string,
      definition: D,
      handler: (ctx: ContextOf<D>) => MaybePromise<OutputOf<D["response"]>>,
    ): void {
      register("get", path, definition, handler as RouteHandler);
    },
    post<D extends SingleDefinition>(
      path: string,
      definition: D,
      handler: (ctx: ContextOf<D>) => MaybePromise<OutputOf<D["response"]>>,
    ): void {
      register("post", path, definition, handler as RouteHandler);
    },
    list<D extends ListDefinition>(
      method: "get" | "post",
      path: string,
      definition: D,
      handler: (ctx: ContextOf<D>) => MaybePromise<{ items: OutputOf<D["item"]>[]; total: number }>,
    ): void {
      register(method, path, definition, handler as RouteHandler);
    },
    build(): Router {
      return router;
    },
  };
}

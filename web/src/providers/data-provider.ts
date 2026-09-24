import type { DataProvider } from "@refinedev/core";
import dataSimpleRest from "@refinedev/simple-rest";

/** The API base address, all resource calls go here. */
const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * Refine's data provider, pointed at the API.
 *
 * Nothing calls a resource until a feature adds one, so the shell renders without a
 * request. The provider is created once here rather than per screen, so pagination,
 * sorting and filtering behave the same everywhere, including inside `DataTable`.
 */
export const dataProvider: DataProvider = dataSimpleRest(API_URL);

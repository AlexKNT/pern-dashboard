import type {
  BaseRecord,
  CreateParams,
  DataProvider,
  DeleteOneParams,
  GetListParams,
  GetOneParams,
  UpdateParams,
} from "@refinedev/core";

/**
 * The data provider maps Refine's list vocabulary to the API's clean envelope.
 *
 * Refine sends `currentPage` and `pageSize` pagination and `_sort` style sorters;
 * the API reads `page`, `pageSize`, `sort` and `q`, and answers `{ data }` or
 * `{ data, total }` rather than the bare array the simple rest provider expects.
 * This provider is the translation layer between the two.
 */
const API_URL = "/api/v1";

type Envelope<T> = { data: T; total?: number };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  const body = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    const error = body as { error?: { message?: string } } | null;
    throw new Error(error?.error?.message ?? `Request failed with status ${response.status}.`);
  }

  return body as T;
}

export const dataProvider: DataProvider = {
  getList: async <TData extends BaseRecord = BaseRecord>({
    resource,
    pagination,
    sorters,
    filters,
  }: GetListParams) => {
    const params = new URLSearchParams();
    if (pagination?.currentPage) params.set("page", String(pagination.currentPage));
    if (pagination?.pageSize) params.set("pageSize", String(pagination.pageSize));
    const firstSorter = sorters?.[0];
    if (firstSorter) {
      params.set("sort", `${firstSorter.order === "desc" ? "-" : ""}${firstSorter.field}`);
    }
    const firstFilter = filters?.[0];
    if (firstFilter && "value" in firstFilter && firstFilter.value) {
      params.set("q", String(firstFilter.value));
    }

    const query = params.toString();
    const body = await request<Envelope<TData[]>>(`/${resource}${query ? `?${query}` : ""}`);
    return { data: body.data, total: body.total ?? body.data.length };
  },

  getOne: async <TData extends BaseRecord = BaseRecord>({ resource, id }: GetOneParams) => {
    const body = await request<Envelope<TData>>(`/${resource}/${String(id)}`);
    return { data: body.data };
  },

  create: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>({
    resource,
    variables,
  }: CreateParams<TVariables>) => {
    const body = await request<Envelope<TData>>(`/${resource}`, {
      method: "POST",
      body: JSON.stringify(variables),
    });
    return { data: body.data };
  },

  update: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>({
    resource,
    id,
    variables,
  }: UpdateParams<TVariables>) => {
    const body = await request<Envelope<TData>>(`/${resource}/${String(id)}`, {
      method: "PATCH",
      body: JSON.stringify(variables),
    });
    return { data: body.data };
  },

  deleteOne: async <TData extends BaseRecord = BaseRecord, TVariables = Record<string, unknown>>({
    resource,
    id,
  }: DeleteOneParams<TVariables>) => {
    await request(`/${resource}/${String(id)}`, { method: "DELETE" });
    return { data: { id } as TData };
  },

  getApiUrl: () => API_URL,
};

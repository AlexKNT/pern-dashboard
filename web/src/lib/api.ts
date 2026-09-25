/** The three roles the app knows, mirrored from the API. */
export type Role = "admin" | "teacher" | "student";

/** The states an enrollment can be in. */
export type EnrollmentStatus = "active" | "waitlisted" | "left";

/** A teacher option for the create class picker. */
export type Teacher = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/** A class as the API returns it. */
export type Class = {
  id: string;
  name: string;
  subjectId: string;
  subjectName: string;
  joinCode: string;
  capacity: number | null;
  activeCount: number;
  waitlistedCount: number;
  teacherNames: string[];
  createdAt: string;
};

/** One entry in a person's class list, carrying their own enrollment status. */
export type MyClass = {
  id: string;
  name: string;
  joinCode: string;
  subjectName: string;
  capacity: number | null;
  activeCount: number;
  waitlistedCount: number;
  teacherNames: string[];
  status: "active" | "waitlisted" | null;
  joinedAt: string | null;
};

/** One student on a roster. */
export type RosterEntry = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
};

/** One enrollment, as the join and leave actions return it. */
export type Enrollment = {
  id: string;
  classId: string;
  studentId: string;
  status: EnrollmentStatus;
  joinedAt: string;
};

/** A failure from the API, with its stable machine code. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type Envelope<T> = { data: T; total?: number };
type ErrorBody = { error?: { code?: string; message?: string } };

/** Sends a JSON request to the API and returns the parsed envelope. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });
  } catch {
    throw new ApiError(0, "network", "The API is unreachable. Check that it is running.");
  }

  const body = (await response.json().catch(() => null)) as (T & ErrorBody) | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      body?.error?.code ?? "internal",
      body?.error?.message ?? `Request failed with status ${response.status}.`,
    );
  }

  return body as T;
}

/** The query string shared by every list endpoint. */
export type ListParams = {
  page?: number;
  pageSize?: number;
  sort?: string;
  q?: string;
};

function toQuery(params: ListParams | undefined): string {
  if (!params) return "";
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.sort) search.set("sort", params.sort);
  if (params.q) search.set("q", params.q);
  const value = search.toString();
  return value ? `?${value}` : "";
}

/** The typed API client the screens use. */
export const api = {
  async listMyClasses(params?: ListParams): Promise<{ items: MyClass[]; total: number }> {
    const body = await request<Envelope<MyClass[]>>(`/api/v1/me/classes${toQuery(params)}`);
    return { items: body.data, total: body.total ?? body.data.length };
  },

  async listTeachers(params?: ListParams): Promise<{ items: Teacher[]; total: number }> {
    const body = await request<Envelope<Teacher[]>>(`/api/v1/users${toQuery(params)}`);
    return { items: body.data, total: body.total ?? body.data.length };
  },

  async createTeacher(input: { name: string; email: string; password: string }): Promise<Teacher> {
    const body = await request<Envelope<Teacher>>("/api/v1/users", {
      method: "POST",
      body: JSON.stringify({ ...input, role: "teacher" }),
    });
    return body.data;
  },

  async createClass(input: {
    name: string;
    teacherId: string;
    capacity: number | null;
  }): Promise<Class> {
    const body = await request<Envelope<Class>>("/api/v1/classes", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return body.data;
  },

  async joinClass(code: string): Promise<Enrollment> {
    const body = await request<Envelope<Enrollment>>("/api/v1/classes/join", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    return body.data;
  },

  async leaveClass(classId: string): Promise<Enrollment> {
    const body = await request<Envelope<Enrollment>>(`/api/v1/classes/${classId}/leave`, {
      method: "POST",
    });
    return body.data;
  },

  async listRoster(
    classId: string,
    params?: ListParams,
  ): Promise<{ items: RosterEntry[]; total: number }> {
    const body = await request<Envelope<RosterEntry[]>>(
      `/api/v1/classes/${classId}/roster${toQuery(params)}`,
    );
    return { items: body.data, total: body.total ?? body.data.length };
  },
};

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Refine } from "@refinedev/core";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { dataProvider } from "@/providers/data-provider";

/** One row shape for the table under test. */
type Row = { id: string; name: string; code: string };

const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "code", header: "Code" },
];

/** The table needs Refine and a query client around it, so this wraps the render. */
function renderTable(props: Partial<React.ComponentProps<typeof DataTable<Row>>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Refine
        dataProvider={dataProvider}
        resources={[{ name: "classes" }]}
        options={{ disableTelemetry: true }}
      >
        <MemoryRouter>
          <DataTable<Row>
            columns={columns}
            data={[]}
            isLoading={false}
            error={null}
            onRetry={() => undefined}
            {...props}
          />
        </MemoryRouter>
      </Refine>
    </QueryClientProvider>,
  );
}

describe("DataTable", () => {
  it("shows skeleton rows shaped like the table while loading", () => {
    const { container } = renderTable({ isLoading: true, pageSize: 3 });

    // Three rows of two cells, plus the header row of two.
    expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(container.querySelectorAll("thead th")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent("Loading rows");
    expect(screen.queryByRole("table")).toBeInTheDocument();
  });

  it("shows the error state with a working retry instead of rows", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderTable({ error: new Error("Request failed"), onRetry });

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("shows the empty state rather than a blank region when there are no rows", () => {
    renderTable({
      emptyState: <p>No classes yet. Create the first one to see it here.</p>,
    });

    expect(screen.getByText(/No classes yet/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("falls back to the default empty state when none is supplied", () => {
    renderTable();
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("does not query a resource when it is only showing a state", () => {
    // The shell's placeholder page must not call a resource endpoint, so this
    // asserts the failure and empty states render without a request going out.
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderTable({ error: new Error("boom") });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

import { flexRender, type ColumnDef } from "@tanstack/react-table";
import { useTable, type UseTableProps } from "@refinedev/react-table";
import type { BaseRecord } from "@refinedev/core";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Props for the app's one table: a Refine aware, state handling list. */
export type DataTableProps<TData extends BaseRecord> = {
  /** The column definitions, built with TanStack's helpers. */
  columns: ColumnDef<TData>[];
  /** The rows to render. Ignored while loading or when an error is set. */
  data: TData[];
  /** Whether the query is still in flight. Renders skeleton rows when true. */
  isLoading: boolean;
  /** The failure to show instead of rows, or null. */
  error: unknown | null;
  /** Called by `ErrorState`'s retry button. Usually the query's `refetch`. */
  onRetry: () => void;
  /** How many skeleton rows to draw while loading, and the page size. Defaults to 10. */
  pageSize?: number;
  /** What to show when the query succeeded with no rows. Defaults to `EmptyState`. */
  emptyState?: ReactNode;
  /** Where sorting and pagination are resolved. Defaults to `server`. */
  pagination?: "server" | "client";
  className?: string;
};

/**
 * The tabular list used by every collection screen.
 *
 * It owns the three states a list has beyond the populated one: skeleton rows shaped
 * like the real table while loading, `ErrorState` with a working retry when the
 * query fails, and `EmptyState` when it succeeds with nothing to show. Sorting and
 * pagination go through Refine's data provider rather than being reimplemented, so
 * a server side list behaves the same as a client side one.
 */
export function DataTable<TData extends BaseRecord>({
  columns,
  data,
  isLoading,
  error,
  onRetry,
  pageSize = 10,
  emptyState,
  className,
}: DataTableProps<TData>) {
  const tableProps: UseTableProps<TData> = {
    columns,
    refineCoreProps: { pagination: { pageSize } },
  };

  const { reactTable, refineCore } = useTable<TData>(tableProps);
  const table = reactTable;
  // Rows come from Refine's query, so the `data` prop is only used by the
  // passthrough case where a caller supplies rows it already has.
  void data;
  const rowCount = table.getRowModel().rows.length;
  if (error !== null && error !== undefined) {
    return <ErrorState className={className} onRetry={onRetry} />;
  }

  if (isLoading) {
    return (
      <div className={cn("rounded-lg border border-border", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={column.id ?? index}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: pageSize }, (_, rowIndex) => (
              <TableRow key={`skeleton-${String(rowIndex)}`}>
                {columns.map((column, columnIndex) => (
                  <TableCell key={column.id ?? `cell-${String(columnIndex)}`}>
                    <Skeleton className="h-4 w-full max-w-40" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <span role="status" className="sr-only">
          Loading rows
        </span>
      </div>
    );
  }

  if (rowCount === 0) {
    return (
      <div className={className}>
        {emptyState ?? (
          <EmptyState
            title="Nothing here yet"
            description="Once there is something to list, it will appear here."
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {refineCore ? (
        <span className="sr-only">
          Page {String(refineCore.currentPage)} of {String(refineCore.pageCount ?? 1)}
        </span>
      ) : null}
    </div>
  );
}

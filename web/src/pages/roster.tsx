import { useParams } from "react-router";
import { useApiQuery } from "@/hooks/use-api-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** The first letter of each of the first two words of a name, for the avatar. */
function initialsOf(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  return letters.length > 0 ? letters : "?";
}

/** Formats an ISO date for the roster. */
function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

/**
 * The roster for one class, the enrolled students. Visible only to the class's
 * teachers and admins, enforced by the API.
 */
export function RosterPage() {
  const { id } = useParams<{ id: string }>();
  const {
    data: students,
    isLoading,
    error,
    refetch,
  } = useApiQuery(() =>
    id
      ? api.listRoster(id, { page: 1, pageSize: 50 }).then((result) => result.items)
      : Promise.resolve([]),
  );
  const studentList = students ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Roster" description="The students currently enrolled in this class." />

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="rounded-lg border border-border">
          <Table>
            <TableBody>
              {Array.from({ length: 5 }, (_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : studentList.length === 0 ? (
        <EmptyState
          title="No students enrolled yet"
          description="When a student joins with the class code, they appear here."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentList.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarFallback>{initialsOf(student.name)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.name}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{student.email}</TableCell>
                    <TableCell>{formatDate(student.joinedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

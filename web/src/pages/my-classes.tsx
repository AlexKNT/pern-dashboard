import { useState } from "react";
import { TicketIcon } from "lucide-react";
import { useApiQuery } from "@/hooks/use-api-query";
import { api, ApiError, type Enrollment } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * A student's class list: join with a code at the top, then the classes they are
 * part of, each with its status and a way to leave.
 */
export function MyClassesPage() {
  const {
    data: classes,
    isLoading,
    error,
    refetch,
  } = useApiQuery(() =>
    api.listMyClasses({ page: 1, pageSize: 50 }).then((result) => result.items),
  );
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const classList = classes ?? [];

  async function handleLeave(classId: string) {
    setLeavingId(classId);
    setLeaveError(null);
    try {
      await api.leaveClass(classId);
      refetch();
    } catch (err) {
      setLeaveError(err instanceof ApiError ? err.message : "Could not leave the class.");
    } finally {
      setLeavingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My classes"
        description="Join a class with its code, and see the classes you are in."
      >
        <JoinClassForm onJoined={refetch} />
      </PageHeader>

      {leaveError ? (
        <p role="alert" className="text-sm text-destructive">
          {leaveError}
        </p>
      ) : null}

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="rounded-lg border border-border">
          <Table>
            <TableBody>
              {Array.from({ length: 4 }, (_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-full max-w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : classList.length === 0 ? (
        <EmptyState
          title="You are not in any classes yet"
          description="Enter a join code above to join your first class."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {classList.map((klass) => (
                  <TableRow key={klass.id}>
                    <TableCell>
                      <span className="font-medium">{klass.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {klass.subjectName} · {klass.teacherNames.join(", ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={klass.status === "waitlisted" ? "outline" : "secondary"}>
                        {klass.status === "waitlisted" ? "Waitlisted" : "Enrolled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLeave(klass.id)}
                        disabled={leavingId === klass.id}
                      >
                        {leavingId === klass.id ? "Leaving…" : "Leave"}
                      </Button>
                    </TableCell>
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

/** The join form a student uses to enter a class code. */
function JoinClassForm({ onJoined }: { onJoined: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState<Enrollment | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setJoined(null);
    setSubmitting(true);
    try {
      const enrollment = await api.joinClass(code);
      setJoined(enrollment);
      setCode("");
      onJoined();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not join that class.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TicketIcon aria-hidden="true" className="size-4 text-muted-foreground" />
          Join a class
        </CardTitle>
        <CardDescription>Enter the six character code your teacher gave you.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="join-code">Join code</FieldLabel>
              <FieldContent>
                <Input
                  id="join-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="ABC123"
                  autoCapitalize="characters"
                  required
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {joined ? (
            <p role="status" className="text-sm text-muted-foreground">
              {joined.status === "waitlisted"
                ? "The class is full, so you are on the waitlist."
                : "You are in. The class now appears in your list."}
            </p>
          ) : null}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Joining…" : "Join"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

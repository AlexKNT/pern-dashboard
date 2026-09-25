import { useState } from "react";
import { Link } from "react-router";
import { PlusIcon, UserPlusIcon } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useApiQuery } from "@/hooks/use-api-query";
import { api, ApiError, type Teacher } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
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
 * The classes screen. An admin creates classes and teacher accounts here, and a
 * teacher sees the classes they teach with a way into each roster. A student is
 * pointed at their own class list.
 */
export function ClassesPage() {
  const { role } = useSession();
  const {
    data: classes,
    isLoading,
    error,
    refetch,
  } = useApiQuery(() =>
    api.listMyClasses({ page: 1, pageSize: 50 }).then((result) => result.items),
  );
  const { data: teachers, refetch: refetchTeachers } = useApiQuery(
    () => api.listTeachers({ page: 1, pageSize: 100 }).then((result) => result.items),
    role === "admin",
  );

  const classList = classes ?? [];

  function handleChanged() {
    refetch();
    if (role === "admin") refetchTeachers();
  }

  if (role === "student") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Classes"
          description="The classes you are part of live under My classes."
        />
        <EmptyState
          title="Your classes are under My classes"
          description="Open My classes to join with a code, see your classes and leave one."
          action={{ label: "Go to My classes", to: "/my-classes" }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Classes"
        description={
          role === "admin"
            ? "Create classes, assign their teachers and see the queue at a glance."
            : "The classes you teach and their current enrolment."
        }
      />

      {role === "admin" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <CreateClassCard teachers={teachers ?? []} onCreated={handleChanged} />
          <CreateTeacherCard onCreated={handleChanged} />
        </div>
      ) : null}

      {error ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <ClassTableSkeleton />
      ) : classList.length === 0 ? (
        <EmptyState
          title={role === "admin" ? "No classes yet" : "No classes assigned to you"}
          description={
            role === "admin"
              ? "Create the first class and give it a teacher and a join code."
              : "An administrator assigns classes to you. They will appear here."
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Waitlist</TableHead>
                  {role === "teacher" ? <TableHead className="w-24" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {classList.map((klass) => (
                  <TableRow key={klass.id}>
                    <TableCell>
                      <span className="font-medium">{klass.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {klass.subjectName}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{klass.joinCode}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {klass.activeCount}
                        {klass.capacity != null ? ` / ${klass.capacity}` : ""}
                      </Badge>
                    </TableCell>
                    <TableCell>{klass.waitlistedCount}</TableCell>
                    {role === "teacher" ? (
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/classes/${klass.id}/roster`}>Roster</Link>
                        </Button>
                      </TableCell>
                    ) : null}
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

/** A few skeleton rows matching the class table, shown while it loads. */
function ClassTableSkeleton() {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {["Class", "Code", "Enrolled", "Waitlist"].map((label) => (
              <TableHead key={label}>
                <Skeleton className="h-4 w-24" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }, (_, index) => (
            <TableRow key={index}>
              {Array.from({ length: 4 }, (_, cell) => (
                <TableCell key={cell}>
                  <Skeleton className="h-4 w-full max-w-32" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** The form an admin uses to create a class with a teacher and a capacity. */
function CreateClassCard({ teachers, onCreated }: { teachers: Teacher[]; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [capacity, setCapacity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createClass({
        name,
        teacherId,
        capacity: capacity.trim() ? Number(capacity) : null,
      });
      setName("");
      setTeacherId("");
      setCapacity("");
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the class.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusIcon aria-hidden="true" className="size-4 text-muted-foreground" />
          Create a class
        </CardTitle>
        <CardDescription>
          A join code is generated for you, and the subject defaults to the general one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="class-name">Class name</FieldLabel>
              <FieldContent>
                <Input
                  id="class-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Intro to Biology"
                  required
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="class-teacher">Teacher</FieldLabel>
              <FieldContent>
                <NativeSelect
                  id="class-teacher"
                  className="w-full"
                  value={teacherId}
                  onChange={(event) => setTeacherId(event.target.value)}
                  required
                >
                  <NativeSelectOption value="">Choose a teacher</NativeSelectOption>
                  {teachers.map((teacher) => (
                    <NativeSelectOption key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="class-capacity">Capacity</FieldLabel>
              <FieldContent>
                <Input
                  id="class-capacity"
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                  placeholder="Leave empty for no limit"
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={submitting || teachers.length === 0}>
            {submitting ? "Creating…" : "Create class"}
          </Button>
          {teachers.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Create a teacher first, then come back to create a class.
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

/** The form an admin uses to create a teacher account. */
function CreateTeacherCard({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.createTeacher({ name, email, password });
      setName("");
      setEmail("");
      setPassword("");
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the teacher.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlusIcon aria-hidden="true" className="size-4 text-muted-foreground" />
          Create a teacher
        </CardTitle>
        <CardDescription>
          The account can sign in right away, no email verification needed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="teacher-name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="teacher-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="teacher-email">Email</FieldLabel>
              <FieldContent>
                <Input
                  id="teacher-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="teacher-password">Password</FieldLabel>
              <FieldContent>
                <Input
                  id="teacher-password"
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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

          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create teacher"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

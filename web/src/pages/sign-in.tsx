import { useState } from "react";
import { Link } from "react-router";
import { useLogin } from "@refinedev/core";
import { GraduationCapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/**
 * The sign in screen at `/sign-in`, a two pane layout: the product pitch on one
 * side and the email and password form on the other. Below `md` the pitch
 * collapses to a compact brand row above the form.
 */
export function SignInPage() {
  const { mutate: login, isPending } = useLogin<{ email: string; password: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    login(
      { email, password },
      {
        onError: (err) => {
          const message =
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: unknown }).message)
              : "";
          setError(message || "Sign in failed. Check your details and try again.");
        },
      },
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4 sm:p-6">
      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-2 lg:items-center">
        <section className="flex flex-col gap-4">
          <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <GraduationCapIcon aria-hidden="true" className="size-5" />
            PERN Admin Dashboard
          </span>
          <h1 className="text-3xl font-medium tracking-tight text-balance">
            One place for departments, classes and enrolment
          </h1>
          <p className="max-w-prose text-base text-muted-foreground">
            Administrators run the academic structure, teachers run their sessions, and students
            join a class with a code.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use your email and password to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <FieldContent>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <FieldContent>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
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

              <Button type="submit" disabled={isPending}>
                {isPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            <span>
              New here?{" "}
              <Link
                to="/sign-up"
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
              >
                Create an account
              </Link>
            </span>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

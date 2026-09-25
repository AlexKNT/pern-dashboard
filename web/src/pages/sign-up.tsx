import { useState } from "react";
import { Link, useNavigate } from "react-router";
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
import { authClient } from "@/lib/auth-client";

/**
 * The sign up screen, the same two pane layout as sign in. Creating an account
 * always produces a student: the API ignores any role, and the role field here is
 * deliberately absent.
 */
export function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: `${window.location.origin}/sign-in`,
      });
      if (signUpError) {
        setError(signUpError.message ?? "Could not create your account.");
        return;
      }
      navigate("/verify-email");
    } finally {
      setIsSubmitting(false);
    }
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
            Join your classes with a code
          </h1>
          <p className="max-w-prose text-base text-muted-foreground">
            Create a student account, verify your email, then enter a class join code to get
            started.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>You will verify your email before signing in.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <FieldContent>
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                  </FieldContent>
                </Field>
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
                      autoComplete="new-password"
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

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            <span>
              Already have an account?{" "}
              <Link
                to="/sign-in"
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
              >
                Sign in
              </Link>
            </span>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

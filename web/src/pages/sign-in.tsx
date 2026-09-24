import { Link } from "react-router";
import { GraduationCapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * The placeholder sign in screen at `/sign-in`.
 *
 * It exists so the signed out redirect has somewhere real to land, and so the route
 * is not a blank page. The accounts feature replaces this file; the shell around it
 * does not change.
 */
export function SignInPage() {
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
            <CardDescription>Accounts arrive with the accounts feature.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              There is no sign in form here yet. Until the accounts feature lands, every visitor is
              signed out, which is the state this screen exists to prove.
            </p>
            <Button asChild variant="outline" className="self-start">
              <Link to="/">Back to the dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

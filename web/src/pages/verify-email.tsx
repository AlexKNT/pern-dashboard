import { Link } from "react-router";
import { MailCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * The screen shown after sign up, asking the person to check their inbox for the
 * verification link. In development and tests the link is written to the API log
 * instead of mailed.
 */
export function VerifyEmailPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MailCheckIcon aria-hidden="true" className="size-5 text-muted-foreground" />
            Check your inbox
          </CardTitle>
          <CardDescription>
            We sent a verification link to the address you signed up with. Open it to verify your
            email, then sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            If you do not see the email, check your spam folder. Once you have verified your
            address, you can sign in.
          </p>
          <Button asChild>
            <Link to="/sign-in">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

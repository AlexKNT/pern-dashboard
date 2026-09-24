import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * The not found screen.
 *
 * It renders inside the shell when a route inside the app is unknown, so the
 * navigation is still there and the reader can get back to somewhere real.
 */
export function NotFoundPage() {
  return (
    <Card className="mx-auto mt-8 max-w-lg">
      <CardHeader>
        <CardTitle>Page not found</CardTitle>
        <CardDescription>That address does not match anything in the dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" size="sm">
          <Link to="/">Back to the dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

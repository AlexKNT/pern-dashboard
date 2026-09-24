import {
  ArrowRightIcon,
  BookOpenIcon,
  BuildingIcon,
  GraduationCapIcon,
  UsersIcon,
} from "lucide-react";
import { Link } from "react-router";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { navigationItems, visibleNavigation } from "@/lib/navigation";

/** One summary figure shown on the dashboard. */
type Summary = {
  label: string;
  value: string;
  hint: string;
  Icon: LucideIcon;
};

const SUMMARIES: Summary[] = [
  { label: "Departments", value: "0", hint: "Nothing recorded yet", Icon: BuildingIcon },
  { label: "Subjects", value: "0", hint: "Nothing recorded yet", Icon: BookOpenIcon },
  { label: "Classes", value: "0", hint: "Nothing recorded yet", Icon: GraduationCapIcon },
  { label: "People", value: "0", hint: "Nothing recorded yet", Icon: UsersIcon },
];

/**
 * The placeholder dashboard the shell renders at `/`.
 *
 * It deliberately calls no resource: the data provider is pointed at the API before
 * any endpoint exists, so a request here would be a console error rather than an
 * empty state. The real figures arrive with the features that own them.
 */
export function DashboardPage() {
  const { user, role } = useSession();
  const destinations = visibleNavigation(navigationItems, role);
  const firstName = user?.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Overview"}
        description="Departments, subjects, classes and the people in them, all in one place."
      />

      <section aria-labelledby="summary-heading" className="flex flex-col gap-3">
        <h2 id="summary-heading" className="text-sm font-medium text-muted-foreground">
          At a glance
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUMMARIES.map(({ label, value, hint, Icon }) => (
            <Card key={label}>
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </CardDescription>
                <CardTitle className="text-2xl font-medium">{value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="next-heading" className="flex flex-col gap-3">
        <h2 id="next-heading" className="text-sm font-medium text-muted-foreground">
          What you can reach
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Your role</CardTitle>
            <CardDescription>
              {role
                ? "The navigation is showing the sections your role may reach."
                : "No role is set on this session yet, so only the shared sections are shown."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ul className="flex flex-wrap gap-2">
              {destinations.map((item) => (
                <li key={item.to}>
                  <Badge variant="secondary">{item.label}</Badge>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="sm" className="self-start">
              <Link to="/classes">
                Start with classes
                <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

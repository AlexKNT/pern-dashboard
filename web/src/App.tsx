import { Refine } from "@refinedev/core";
import { Outlet, Route, Routes } from "react-router";
import { AppShell } from "@/components/app-shell";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { RequireSession, SignInGuard } from "@/components/sign-in-guard";
import { authProvider } from "@/providers/auth-provider";
import { dataProvider } from "@/providers/data-provider";
import { notificationProvider } from "@/providers/notification-provider";
import { DashboardPage } from "@/pages/dashboard";
import { NotFoundPage } from "@/pages/not-found";
import { SignInPage } from "@/pages/sign-in";
import { SignUpPage } from "@/pages/sign-up";
import { VerifyEmailPage } from "@/pages/verify-email";
import { ClassesPage } from "@/pages/classes";
import { MyClassesPage } from "@/pages/my-classes";
import { RosterPage } from "@/pages/roster";

/**
 * A placeholder for a destination the navigation already offers but no feature has
 * built yet.
 *
 * It says so plainly rather than rendering an empty page, so a half built app is
 * obvious to anyone clicking through it.
 */
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
      <p className="max-w-prose text-sm text-muted-foreground">
        This section is routed and reachable. Its screen arrives with the feature that owns it.
      </p>
    </div>
  );
}

/** The signed in frame: everything inside the shell. */
function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

/**
 * The app's root: Refine's providers around the router, the theme provider outermost
 * so the shell and the toasts both read the resolved theme.
 *
 * A signed out visitor is sent to `/sign-in` by Refine's `Authenticated` guard, which
 * reads the auth provider's `check`. Every unbuilt destination goes through the same
 * shell, so the navigation is real even where the screens are not yet.
 */
export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <Refine
            dataProvider={dataProvider}
            authProvider={authProvider}
            notificationProvider={notificationProvider}
            resources={[]}
            options={{ syncWithLocation: true, disableTelemetry: true }}
          >
            <Routes>
              <Route
                path="/sign-in"
                element={
                  <SignInGuard>
                    <SignInPage />
                  </SignInGuard>
                }
              />
              <Route
                path="/sign-up"
                element={
                  <SignInGuard>
                    <SignUpPage />
                  </SignInGuard>
                }
              />
              <Route
                path="/verify-email"
                element={
                  <SignInGuard>
                    <VerifyEmailPage />
                  </SignInGuard>
                }
              />
              <Route
                element={
                  <RequireSession>
                    <ShellLayout />
                  </RequireSession>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="departments" element={<PlaceholderPage title="Departments" />} />
                <Route path="subjects" element={<PlaceholderPage title="Subjects" />} />
                <Route path="classes" element={<ClassesPage />} />
                <Route path="classes/:id/roster" element={<RosterPage />} />
                <Route path="schedule" element={<PlaceholderPage title="Schedule" />} />
                <Route path="people" element={<PlaceholderPage title="People" />} />
                <Route path="sessions" element={<PlaceholderPage title="My sessions" />} />
                <Route path="my-classes" element={<MyClassesPage />} />
                <Route path="audit" element={<PlaceholderPage title="Audit log" />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Toaster />
          </Refine>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

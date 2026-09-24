import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "@/components/error-state";

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { error: Error | null };

/**
 * Catches a rendering error anywhere below it and shows a real screen instead of a
 * blank page.
 *
 * React only offers error boundaries as a class component; nothing else in the app
 * needs to be one. Retrying clears the error and re-renders the tree, which is
 * enough for the transient failures this exists to catch.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // The console is the only reporting surface until error monitoring lands.
    console.error("Unhandled render error", error, info.componentStack);
  }

  private readonly handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <h1 className="sr-only">Something went wrong</h1>
          <ErrorState
            title="This screen could not be shown"
            message={error.message}
            onRetry={this.handleRetry}
          />
        </div>
      </main>
    );
  }
}

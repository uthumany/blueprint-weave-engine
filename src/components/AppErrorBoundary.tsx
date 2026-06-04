import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

type Props = {
  children: ReactNode;
  fallback?: (args: { error: Error; reset: () => void }) => ReactNode;
};

type State = {
  error: Error | null;
  componentStack: string | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary]", error, info.componentStack);
    this.setState({ componentStack: info.componentStack ?? null });
    reportLovableError(error, {
      boundary: "app_error_boundary",
      componentStack: info.componentStack,
    });
  }

  reset = () => this.setState({ error: null, componentStack: null });

  render() {
    const { error, componentStack } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.reset });
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-lg w-full text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            › runtime error
          </p>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
            Something broke while rendering this page
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The error was captured and logged. You can try again or head home.
          </p>
          <pre className="mt-4 max-h-48 overflow-auto rounded-lg border border-border bg-background/50 p-3 text-left text-[11px] font-mono text-muted-foreground whitespace-pre-wrap">
            {error.message}
            {componentStack ? `\n${componentStack.trim()}` : ""}
          </pre>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={this.reset}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Try again
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}

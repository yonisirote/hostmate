import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: unknown }
> {
  state: { hasError: boolean; error?: unknown } = { hasError: false };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const message =
        this.state.error instanceof Error
          ? this.state.error.message
          : String(this.state.error);
      return (
        <div className="min-h-screen bg-warm-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-warm-200 rounded-lg shadow p-6">
            <h1 className="text-xl font-bold text-warm-900">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Open the console for details.
            </p>
            <pre className="mt-4 text-xs bg-gray-50 border border-gray-200 rounded p-3 overflow-auto">
              {message}
            </pre>
            <button
              className="mt-4 inline-flex items-center px-4 py-2 rounded-md bg-warm-600 text-white hover:bg-warm-700"
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

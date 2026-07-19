import { Component, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-destructive">Something went wrong</h2>
            <p className="mt-2 text-muted-foreground">
              We encountered an error while loading this page.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={this.handleRetry}>Try again</Button>
            <Button variant="outline" onClick={() => (window.location.href = '/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };

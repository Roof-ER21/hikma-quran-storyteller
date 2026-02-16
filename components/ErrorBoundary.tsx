import React, { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { openIssueReporter } from '../services/issueReportService';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicit property declarations for React 19 TS compatibility
  declare readonly props: Readonly<ErrorBoundaryProps>;
  declare state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen-safe flex items-center justify-center bg-slate-900 text-white p-4">
          <div className="text-center">
            <h1 className="text-2xl mb-4">Something went wrong</h1>
            <p className="text-slate-400 mb-4">Please refresh the page to try again.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-rose-600 rounded-lg hover:bg-rose-700"
              >
                Refresh Page
              </button>
              <button
                onClick={() =>
                  openIssueReporter({
                    source: 'error_boundary',
                    category: 'crash',
                    summary: this.state.error?.message || 'Unhandled error boundary crash',
                  })
                }
                className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
              >
                Report Issue
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

import React from 'react';
import { theme } from '../styles/theme';
import Button from './Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md text-center rounded-2xl bg-white p-8 shadow-xl border border-slate-100">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-500 text-4xl">
                ⚠️
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-800">Something went wrong</h2>
            <p className="mb-6 text-sm text-slate-500">
              An unexpected error occurred in the application. Please try refreshing the page or contact support if the problem persists.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button 
                onClick={() => window.location.reload()} 
                variant="primary"
              >
                Refresh Page
              </Button>
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline"
              >
                Go to Home
              </Button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-8 text-left">
                <p className="text-xs font-bold text-red-500 mb-2">Error Details (Development Only):</p>
                <pre className="p-4 bg-slate-900 text-red-400 text-xs overflow-x-auto rounded-lg text-left">
                  {this.state.error.toString()}
                  <br />
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error in Admin:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 bg-[#141418] border border-red-500/30 rounded-2xl text-zinc-200 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle size={24} />
            <h2 className="text-lg font-bold">Something went wrong in this section</h2>
          </div>

          <p className="text-xs text-zinc-400">
            An unexpected error occurred while rendering this page:
          </p>

          <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-xl text-red-300 font-mono text-xs overflow-x-auto">
            {this.state.error?.message || 'Unknown error'}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition"
            >
              <RefreshCw size={14} /> Reload Page
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

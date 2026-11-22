import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-[#F7F3EA] dark:bg-[#08090B] font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="max-w-md w-full p-6 rounded-2xl border border-[#E8E1D5] dark:border-[#242321] bg-white dark:bg-[#18191D] text-center shadow-xl">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#171717] dark:text-[#F5F3EF] mb-2">
              Something went wrong
            </h3>
            <p className="text-xs text-[#6B665E] dark:text-[#A6A4A0] mb-6 leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred. Please reload to recover.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E8E1D5] dark:border-[#242321] text-[#171717] dark:text-[#F5F3EF] hover:bg-[#F7F3EA] dark:hover:bg-[#111215] cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#FFC900] text-[#08090B] hover:brightness-110 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

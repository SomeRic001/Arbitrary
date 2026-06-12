"use client";

import { Component, ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  section?: string;
};

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[ErrorBoundary]${this.props.section ? ` [${this.props.section}]` : ""} caught error:`,
      error,
      info.componentStack,
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-400 rounded-[2.5rem] border border-black/5 bg-white shadow-sm">
          <div className="w-14 h-14 rounded-[2rem] bg-zinc-100 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-wider text-zinc-500">
              Something went wrong
            </p>
            <p className="text-xs text-zinc-300 font-medium mt-1">
              {this.props.section
                ? `The ${this.props.section} section failed to load`
                : "This section failed to load"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 text-xs font-black uppercase tracking-wider text-black bg-[#FACC15] hover:bg-black hover:text-[#FACC15] rounded-2xl transition-all"
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

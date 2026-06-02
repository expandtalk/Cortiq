import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  tabName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TabErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[TabErrorBoundary:${this.props.tabName ?? 'unknown'}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="font-medium text-foreground">
            {this.props.tabName ? `${this.props.tabName} failed to load` : 'This section failed to load'}
          </p>
          {this.state.error && (
            <p className="text-sm text-muted-foreground max-w-sm">{this.state.error.message}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

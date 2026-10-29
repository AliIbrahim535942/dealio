import {
  Component,
  type ErrorInfo,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { ErrorState } from '../../components/shared/StateViews';

type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    void _error;
    void _info;
  }

  render(): ReactNode {
    return this.state.hasError ? (
      <ErrorState title='The application could not load' />
    ) : (
      this.props.children
    );
  }
}

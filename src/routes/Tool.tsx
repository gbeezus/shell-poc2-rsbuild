import {
  Component,
  ErrorInfo,
  JSX,
  ReactNode,
  Suspense,
  lazy,
  useState,
} from 'react';
import styles from './Tool.module.css';

// React.lazy works against the federated module just like a local code-split.
// The MF runtime resolves `thirdparty/Tool` against the remote configured in
// rsbuild.config.ts. No async-boundary gymnastics required.
const FederatedTool = lazy(() => import('thirdparty/Tool'));

interface BoundaryProps {
  children: ReactNode;
  onRetry: () => void;
  retryKey: number;
}

interface BoundaryState {
  hasError: boolean;
  message?: string;
}

class ToolErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(err: Error): BoundaryState {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(err: Error, info: ErrorInfo): void {
    console.error('Federated component failed to load:', err, info);
  }

  componentDidUpdate(prevProps: BoundaryProps): void {
    if (prevProps.retryKey !== this.props.retryKey && this.state.hasError) {
      this.setState({ hasError: false, message: undefined });
    }
  }

  render(): JSX.Element {
    if (this.state.hasError) {
      return (
        <div className={styles.fallback} role="alert">
          <h3>Tool unavailable</h3>
          <p>
            The federated component could not be loaded. The remote may be
            down, the version contract may be mismatched, or the network
            request to <code>remoteEntry.js</code> may have failed.
          </p>
          {this.state.message && (
            <p>
              <code>{this.state.message}</code>
            </p>
          )}
          <button type="button" onClick={this.props.onRetry}>
            Retry
          </button>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}

function Tool() {
  const [retryKey, setRetryKey] = useState(0);

  return (
    <article>
      <h1>Tool — federated third-party component</h1>
      <p>
        Loaded at runtime from the third-party deployment via Module
        Federation. The shell never imports the component source — only its
        name, agreed in the federation contract.
      </p>
      <ToolErrorBoundary
        onRetry={() => setRetryKey((n) => n + 1)}
        retryKey={retryKey}
      >
        <Suspense
          key={retryKey}
          fallback={
            <p className={styles.loading}>Loading remote component…</p>
          }
        >
          <FederatedTool
            session={{
              userName: 'agency.user@example.gov',
              agency: 'GSA',
            }}
          />
        </Suspense>
      </ToolErrorBoundary>
    </article>
  );
}

export default Tool;

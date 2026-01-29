import { FallbackProps, getErrorMessage } from 'react-error-boundary';

export function DemoErrorFallback(props: FallbackProps) {
  const { error, resetErrorBoundary } = props;

  return (
    <div role="alert">
      <p>There was an error while rendering the demo.</p>
      <pre>{getErrorMessage(error) ?? 'Unknown error'}</pre>
      <button type="button" onClick={resetErrorBoundary}>
        Try again
      </button>
    </div>
  );
}

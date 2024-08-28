import * as React from 'react';
import { FallbackProps } from 'react-error-boundary';

export function DemoErrorFallback(props: FallbackProps) {
  const { error, resetErrorBoundary } = props;

  return (
    <div role="alert">
      <p>There was an error while rendering the demo.</p>
      <pre>{error.message}</pre>
      <button type="button" onClick={resetErrorBoundary}>
        Try again
      </button>
    </div>
  );
}

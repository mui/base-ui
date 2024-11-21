import * as React from 'react';
import * as BaseDemo from 'docs/src/blocks/Demo';
import { ErrorBoundary } from 'react-error-boundary';
import { useDemoContext } from 'docs/src/blocks/Demo/DemoContext';
import { DemoErrorFallback } from './DemoErrorFallback';

export function DemoPlayground() {
  const { selectedVariant } = useDemoContext();

  return (
    <ErrorBoundary FallbackComponent={DemoErrorFallback}>
      <BaseDemo.Playground
        aria-label="Component demo"
        data-variant={selectedVariant.name}
        className="DemoPlayground"
      />
    </ErrorBoundary>
  );
}

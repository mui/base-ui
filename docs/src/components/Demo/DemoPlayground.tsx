import * as React from 'react';
import * as BaseDemo from 'docs/src/blocks/Demo';
import { ErrorBoundary } from 'react-error-boundary';
import { useDemoContext } from 'docs/src/blocks/Demo/DemoContext';
import { DemoErrorFallback } from './DemoErrorFallback';

export function DemoPlayground() {
  const { selectedVariant } = useDemoContext();

  return (
    <ErrorBoundary FallbackComponent={DemoErrorFallback}>
      <div className="DemoPlayground">
        <BaseDemo.Playground
          aria-label="Component demo"
          data-demo={selectedVariant.name}
          className="DemoPlaygroundInner"
        />
      </div>
    </ErrorBoundary>
  );
}

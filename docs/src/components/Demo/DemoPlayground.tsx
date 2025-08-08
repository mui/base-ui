import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { DemoErrorFallback } from './DemoErrorFallback';

export type DemoPlaygroundProps = {
  component: React.ReactNode;
  name?: string;
};

export function DemoPlayground({ component, name }: DemoPlaygroundProps) {
  return (
    <ErrorBoundary FallbackComponent={DemoErrorFallback}>
      <div className="DemoPlayground">
        <div aria-label="Component demo" data-demo={name} className="DemoPlaygroundInner">
          {component}
        </div>
      </div>
    </ErrorBoundary>
  );
}

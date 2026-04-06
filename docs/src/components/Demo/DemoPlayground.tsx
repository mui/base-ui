import { ErrorBoundary } from 'react-error-boundary';
import kebabCase from 'es-toolkit/compat/kebabCase';
import { DemoErrorFallback } from './DemoErrorFallback';

export type DemoPlaygroundProps = {
  component: React.ReactNode;
  variant?: string;
  // Only used for the extra Stackblitz/CSB link at the top of demo, it has to
  // specifically be placed here for the reading order to make sense for SRs
  children?: React.ReactNode;
};

export function DemoPlayground({ component, variant, children }: DemoPlaygroundProps) {
  return (
    <ErrorBoundary FallbackComponent={DemoErrorFallback}>
      <div className="DemoPlayground">
        <div
          aria-label="Component demo"
          data-demo={kebabCase(variant)}
          className="DemoPlaygroundInner"
        >
          {component}
        </div>
        {children}
      </div>
    </ErrorBoundary>
  );
}

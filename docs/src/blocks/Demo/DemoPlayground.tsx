'use client';

import * as React from 'react';
import { DemoContext } from './DemoContext';

export function DemoPlayground(props: DemoPlayground.Props) {
  const demoContext = React.useContext(DemoContext);
  if (!demoContext) {
    throw new Error('Demo.Playground must be used within a Demo.Root');
  }

  const {
    state: { selectedVariant },
  } = demoContext;

  const { component: DemoComponent } = selectedVariant;

  return (
    <div {...props}>
      <DemoComponent />
    </div>
  );
}

export namespace DemoPlayground {
  export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
  }
}

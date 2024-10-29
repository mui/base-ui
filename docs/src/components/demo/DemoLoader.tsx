import * as React from 'react';

import { loadDemo } from './loadDemo';
import { Demo } from './Demo';

export interface DemoLoaderProps {
  demo: string;
  componentName: string;
}

export async function DemoLoader(props: DemoLoaderProps) {
  const { componentName, demo } = props;
  try {
    const demoVariants = await loadDemo(componentName, demo);
    if (!demoVariants || demoVariants.length === 0) {
      return (
        <div role="alert">
          No demos named &quot;{demo}&quot; found for the {componentName} component.
        </div>
      );
    }

    return <Demo variants={demoVariants} />;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error);
      return (
        <div role="alert">
          Unable to render the {demo} demo.
          <pre>{JSON.stringify(error, undefined, 2)}</pre>
        </div>
      );
    }

    return <div role="alert">Unable to render the {demo} demo.</div>;
  }
}

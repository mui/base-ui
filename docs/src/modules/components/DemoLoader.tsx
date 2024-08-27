import * as React from 'react';

import { loadDemo } from 'docs-base/src/utils/loadDemo';
import { Demo } from './Demo';
import classes from './DemoLoader.module.css';

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
        <div role="alert" className={classes.error}>
          No demos named &quot;{demo}&quot; found for the {componentName} component.
        </div>
      );
    }

    return <Demo componentName={componentName} demoName={demo} variants={demoVariants} />;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      return (
        <div role="alert" className={classes.error}>
          Unable to render the {demo} demo.
          <pre>{JSON.stringify(error, undefined, 2)}</pre>
        </div>
      );
    }

    return (
      <div role="alert" className={classes.error}>
        Unable to render the {demo} demo.
      </div>
    );
  }
}

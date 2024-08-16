import * as React from 'react';
import clsx from 'clsx';
import { loadDemo } from 'docs-base/src/utils/loadDemo';
import * as BaseDemo from 'docs-base/src/blocks/Demo';
import { DemoVariantSelector } from './DemoVariantSelector';
import classes from './Demo.module.css';

export interface DemoProps {
  className?: string;
  demo: string;
  componentName: string;
}

export async function Demo(props: DemoProps) {
  const { componentName, demo, className } = props;

  try {
    const demoVariants = await loadDemo(componentName, demo);
    if (demoVariants.length === 0) {
      return (
        <div className={clsx(classes.error, className)}>No variants found for the {demo} demo.</div>
      );
    }

    return (
      <BaseDemo.Root variants={demoVariants} className={classes.root}>
        <BaseDemo.Playground className={classes.playground} />
        <div className={classes.toolbar}>
          <DemoVariantSelector />
        </div>
        <div className={classes.source}>
          <BaseDemo.SourceBrowser className={classes.scrollArea} />
        </div>
      </BaseDemo.Root>
    );
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      return (
        <div className={clsx(classes.error, className)}>
          Unable to render the {demo} demo.
          <pre>{JSON.stringify(error, undefined, 2)}</pre>
        </div>
      );
    }

    return <div className={clsx(classes.error, className)}>Unable to render the {demo} demo.</div>;
  }
}

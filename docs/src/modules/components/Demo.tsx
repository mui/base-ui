import * as React from 'react';
import clsx from 'clsx';
import { loadDemo } from 'docs-base/src/utils/loadDemo';
import * as BaseDemo from 'docs-base/src/blocks/Demo';
import { CopyIcon } from 'docs-base/src/icons/Copy';
import { Tooltip } from 'docs-base/src/design-system/Tooltip';
import { DemoVariantSelector } from './DemoVariantSelector';
import { DemoFileSelector } from './DemoFileSelector';
import { CodeSandboxLink } from './CodeSandboxLink';
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
          <div className={classes.buttons}>
            <Tooltip label="Copy source code">
              <BaseDemo.SourceCopy className={classes.iconButton} aria-label="Copy source code">
                <CopyIcon />
              </BaseDemo.SourceCopy>
            </Tooltip>
            <CodeSandboxLink
              className={classes.iconButton}
              title={`Base UI ${componentName} demo`}
            />
          </div>
        </div>

        <DemoFileSelector />

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

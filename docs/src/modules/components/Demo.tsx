'use client';

import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import * as BaseDemo from 'docs-base/src/blocks/Demo';
import { CopyIcon } from 'docs-base/src/icons/Copy';
import { ResetIcon } from 'docs-base/src/icons/Reset';
import { ResetFocusIcon } from 'docs-base/src/icons/ResetFocus';
import { Tooltip } from 'docs-base/src/design-system/Tooltip';
import { DemoVariantSelector } from './DemoVariantSelector';
import { DemoFileSelector } from './DemoFileSelector';
import { CodeSandboxLink } from './CodeSandboxLink';
import classes from './Demo.module.css';
import { DemoErrorFallback } from './DemoErrorFallback';

export interface DemoProps {
  componentName: string;
  demoName: string;
  variants: BaseDemo.DemoVariant[];
}

export function Demo(props: DemoProps) {
  const { componentName, demoName, variants: demoVariants } = props;

  const playgroundRef = React.useRef<HTMLDivElement>(null);

  const [key, setKey] = React.useState(0);

  const resetFocus = React.useCallback(() => {
    const playground = playgroundRef.current;
    if (playground) {
      playground.focus();
    }
  }, []);

  const handlePlaygroundMouseDown = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      event.preventDefault();
    }
  }, []);

  const resetDemo = React.useCallback(() => {
    setKey((prevKey) => prevKey + 1);
  }, []);

  const title = `Base UI ${componentName} demo`;
  const description = `Base UI ${componentName} ${demoName} demo`;

  return (
    <BaseDemo.Root variants={demoVariants} className={classes.root}>
      <ErrorBoundary FallbackComponent={DemoErrorFallback}>
        <BaseDemo.Playground
          className={classes.playground}
          tabIndex={-1}
          ref={playgroundRef}
          onMouseDown={handlePlaygroundMouseDown}
          key={key}
        />
      </ErrorBoundary>

      <div className={classes.toolbar}>
        <DemoVariantSelector />
        <div className={classes.buttons}>
          <Tooltip label="Copy source code">
            <BaseDemo.SourceCopy className={classes.iconButton} aria-label="Copy source code">
              <CopyIcon />
            </BaseDemo.SourceCopy>
          </Tooltip>

          <Tooltip label="Reset focus to test keyboard navigation">
            <button
              type="button"
              onClick={resetFocus}
              className={classes.iconButton}
              aria-label="Reset focus to test keyboard navigation"
            >
              <ResetFocusIcon />
            </button>
          </Tooltip>

          <Tooltip label="Reset the demo">
            <button
              type="button"
              onClick={resetDemo}
              className={classes.iconButton}
              aria-label="Reset the demo"
            >
              <ResetIcon />
            </button>
          </Tooltip>

          <CodeSandboxLink className={classes.iconButton} title={title} description={description} />
        </div>
      </div>

      <DemoFileSelector />

      <div className={classes.source}>
        <BaseDemo.SourceBrowser className={classes.scrollArea} />
      </div>
    </BaseDemo.Root>
  );
}

'use client';

import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import * as BaseDemo from 'docs-base/src/blocks/Demo';
import { CopyIcon } from 'docs-base/src/icons/Copy';
import { ResetIcon } from 'docs-base/src/icons/Reset';
import { ResetFocusIcon } from 'docs-base/src/icons/ResetFocus';
import { IconButton } from 'docs-base/src/design-system/IconButton';
import { DemoVariantSelector } from './DemoVariantSelector';
import { DemoFileSelector } from './DemoFileSelector';
import { CodeSandboxLink } from './CodeSandboxLink';
import { DemoErrorFallback } from './DemoErrorFallback';
import classes from './Demo.module.css';

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
          <BaseDemo.SourceCopy
            render={<IconButton label="Copy source code" size={2} withTooltip />}
          >
            <CopyIcon />
          </BaseDemo.SourceCopy>

          <IconButton
            onClick={resetFocus}
            label="Reset focus to test keyboard navigation"
            withTooltip
            size={2}
          >
            <ResetFocusIcon />
          </IconButton>

          <IconButton onClick={resetDemo} label="Reset the demo" withTooltip size={2}>
            <ResetIcon />
          </IconButton>

          <CodeSandboxLink title={title} description={description} />
        </div>
      </div>

      <DemoFileSelector />

      <div className={classes.source}>
        <BaseDemo.SourceBrowser className={classes.scrollArea} />
      </div>
    </BaseDemo.Root>
  );
}

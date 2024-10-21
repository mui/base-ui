'use client';
import * as React from 'react';
import clsx from 'clsx';
import { DemoContext } from 'docs/src/blocks/Demo';
import { Tabs } from '@base_ui/react/Tabs';
import classes from './DemoFileSelector.module.css';

export interface DemoFileSelectorProps {
  className?: string;
}

export function DemoFileSelector(props: DemoFileSelectorProps) {
  const { className } = props;

  const demoContext = React.useContext(DemoContext);
  if (!demoContext) {
    throw new Error('Missing DemoContext');
  }

  const {
    selectedVariant: { files },
    setSelectedFile,
    selectedFile,
  } = demoContext;

  if (files.length < 2) {
    return null;
  }

  return (
    <Tabs.Root value={selectedFile} onValueChange={setSelectedFile}>
      <Tabs.List className={clsx(className, classes.root)} aria-label="File selector">
        {files.map((file) => (
          <Tabs.Tab value={file} key={file.path} className={classes.tab}>
            {file.name}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}

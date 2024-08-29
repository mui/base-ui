'use client';

import * as React from 'react';
import clsx from 'clsx';
import { DemoContext } from 'docs-base/src/blocks/Demo';
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
    selectFile,
    selectedFile,
  } = demoContext;

  if (files.length < 2) {
    return null;
  }

  return (
    <div className={clsx(className, classes.root)} aria-label="File selector">
      {files.map((file) => (
        <button
          type="button"
          key={file.path}
          onClick={() => selectFile(file)}
          className={classes.tab}
          data-selected={file === selectedFile}
          aria-pressed={file === selectedFile || undefined}
        >
          {file.name}
        </button>
      ))}
    </div>
  );
}

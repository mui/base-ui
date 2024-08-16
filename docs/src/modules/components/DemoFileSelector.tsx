'use client';

import * as React from 'react';
import { DemoContext } from 'docs-base/src/blocks/Demo';

export function DemoFileSelector(props: React.HtmlHTMLAttributes<HTMLDivElement>) {
  const demoContext = React.useContext(DemoContext);
  if (!demoContext) {
    throw new Error('Missing DemoContext');
  }

  const {
    state: {
      selectedVariant: { files },
    },
    selectFile,
  } = demoContext;

  if (files.length < 2) {
    return null;
  }

  return (
    <div {...props}>
      {files.map((file) => (
        <button type="button" key={file.path} onClick={() => selectFile(file)}>
          {file.name}
        </button>
      ))}
    </div>
  );
}

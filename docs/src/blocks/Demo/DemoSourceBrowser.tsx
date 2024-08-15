'use client';

import * as React from 'react';
import { DemoContext } from './DemoContext';

export function DemoSourceBrowser(props: React.HTMLAttributes<HTMLDivElement>) {
  const demoContext = React.useContext(DemoContext);
  if (!demoContext) {
    throw new Error('Demo.Playground must be used within a Demo.Root');
  }

  const {
    state: { selectedFile },
  } = demoContext;

  if (selectedFile.prettyContent != null) {
    // eslint-disable-next-line react/no-danger
    return <div {...props} dangerouslySetInnerHTML={{ __html: selectedFile.prettyContent }} />;
  }

  return (
    <div {...props}>
      <pre>{selectedFile.content}</pre>
    </div>
  );
}

export namespace DemoSourceBrowser {}

'use client';
import * as React from 'react';
import { DemoContext } from 'docs/src/blocks/Demo';
import { Tabs } from '@base-ui-components/react/tabs';

interface DemoFileSelectorProps {
  onTabChange?: () => void;
}

export function DemoFileSelector({ onTabChange }: DemoFileSelectorProps) {
  const demoContext = React.useContext(DemoContext);
  if (!demoContext) {
    throw new Error('Missing DemoContext');
  }

  const {
    selectedVariant: { files },
    setSelectedFile,
    selectedFile,
  } = demoContext;

  if (files.length === 1) {
    return <div className="DemoFilename">{files[0].name}</div>;
  }

  return (
    <Tabs.Root
      value={selectedFile}
      onValueChange={(value) => {
        setSelectedFile(value);
        onTabChange?.();
      }}
    >
      <Tabs.List className="DemoTabsList" aria-label="Files">
        {files.map((file) => (
          <Tabs.Tab className="DemoTab" value={file} key={file.path}>
            {file.name}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}

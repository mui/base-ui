'use client';

import * as React from 'react';
import { Tabs } from '@base-ui-components/react/tabs';

interface DemoFileSelectorProps {
  files: Array<{ name: string; slug?: string; component: React.ReactNode }>;
  selectedFileName: string | undefined;
  selectFileName: (fileName: string) => void;
  onTabChange?: () => void;
}

type Tab = { id: string; name: string; slug?: string };

export function DemoFileSelector({
  files,
  selectedFileName,
  selectFileName,
  onTabChange,
}: DemoFileSelectorProps) {
  const tabs: Tab[] = React.useMemo(
    () => files.map(({ name, slug }) => ({ id: name, name, slug })),
    [files],
  );

  const onValueChange = React.useCallback(
    (value: string) => {
      selectFileName(value);
      onTabChange?.();
    },
    [selectFileName, onTabChange],
  );

  if (files.length === 1) {
    return <div className="DemoFilename">{files[0].name}</div>;
  }

  return (
    <Tabs.Root value={selectedFileName} onValueChange={onValueChange}>
      <Tabs.List className="DemoTabsList" aria-label="Files">
        {tabs.map((tab: Tab) => (
          <Tabs.Tab className="DemoTab" value={tab.id} key={tab.id}>
            {tab.name}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}

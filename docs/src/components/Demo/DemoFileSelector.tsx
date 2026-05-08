'use client';

import * as React from 'react';
import { Tabs } from '@base-ui/react/tabs';

interface DemoFileSelectorProps {
  files: Array<{ name: string; slug?: string; component: React.ReactNode }>;
  selectedFileName: string | undefined;
  selectFileName: (fileName: string) => void;
  onTabChange?: () => void;
}

type Tab = { id: string; name: string; slug?: string };

function shouldPreventNavigation(event: React.MouseEvent) {
  return event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
}

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

  const onTabClick = React.useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    if (shouldPreventNavigation(event)) {
      event.preventDefault();
    }
  }, []);

  if (files.length === 1) {
    return (
      <a className="DemoFilename" href={files[0].slug ? `#${files[0].slug}` : undefined}>
        {files[0].name}
      </a>
    );
  }

  return (
    <Tabs.Root value={selectedFileName} onValueChange={onValueChange}>
      <Tabs.List className="DemoTabsList" aria-label="Files">
        {tabs.map((tab: Tab) => (
          <Tabs.LinkTab
            href={tab.slug ? `#${tab.slug}` : undefined}
            className="DemoTab"
            value={tab.id}
            key={tab.id}
            onClick={onTabClick}
          >
            {tab.name}
          </Tabs.LinkTab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}

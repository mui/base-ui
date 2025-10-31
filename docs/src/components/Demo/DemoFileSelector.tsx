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

  const modifierKeysRef = React.useRef(false);

  const onValueChange = React.useCallback(
    (value: string) => {
      // Don't change tab if modifier keys were pressed (user is opening in new tab)
      if (modifierKeysRef.current) {
        return;
      }

      selectFileName(value);
      onTabChange?.();
    },
    [selectFileName, onTabChange],
  );

  const onTabPointerDown = React.useCallback((event: React.PointerEvent) => {
    // Track modifier keys before focus event fires
    modifierKeysRef.current = event.ctrlKey || event.metaKey;
  }, []);

  const onTabClick = React.useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow Ctrl+Click (or Cmd+Click on Mac) to open in new tab
    if (event.ctrlKey || event.metaKey) {
      // Reset modifier keys flag after all event handlers complete
      queueMicrotask(() => {
        modifierKeysRef.current = false;
      });
    } else {
      // Prevent scroll jump to anchor
      event.preventDefault();
      modifierKeysRef.current = false;
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
          <Tabs.Tab
            // eslint-disable-next-line jsx-a11y/control-has-associated-label
            render={<a href={tab.slug ? `#${tab.slug}` : undefined} onClick={onTabClick} />}
            className="DemoTab"
            value={tab.id}
            key={tab.id}
            nativeButton={false}
            onPointerDown={onTabPointerDown}
          >
            {tab.name}
          </Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}

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

function isModifiedClick(event: React.MouseEvent | React.PointerEvent) {
  return event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0;
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
    modifierKeysRef.current = isModifiedClick(event);
  }, []);

  const onTabClick = React.useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isModifiedClick(event)) {
      // Let modified clicks preserve the link's native behavior.
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
          <Tabs.LinkTab
            href={tab.slug ? `#${tab.slug}` : undefined}
            className="DemoTab"
            value={tab.id}
            key={tab.id}
            onClick={onTabClick}
            onPointerDown={onTabPointerDown}
          >
            {tab.name}
          </Tabs.LinkTab>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}

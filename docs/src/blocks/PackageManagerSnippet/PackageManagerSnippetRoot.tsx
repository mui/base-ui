'use client';

import * as React from 'react';
import * as Tabs from '@base_ui/react/Tabs';

export function PackageManagerSnippetRoot(props: PackageManagerSnippetRoot.Props) {
  const { children, value, onValueChange, options, renderTab, renderTabsList } = props;

  React.useEffect(() => {
    const storedValue = localStorage.getItem('package-manager');
    if (storedValue != null) {
      onValueChange(storedValue);
    }
  }, [onValueChange]);

  React.useEffect(() => {
    localStorage.setItem('package-manager', value);
  }, [value]);

  return (
    <Tabs.Root value={value} onValueChange={onValueChange}>
      <Tabs.List render={renderTabsList} aria-label="Package manager selector">
        {options.map((option) => (
          <Tabs.Tab key={option.value} value={option.value} render={renderTab}>
            {option.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {children}
    </Tabs.Root>
  );
}

export namespace PackageManagerSnippetRoot {
  export type Props = {
    children: React.ReactNode;
    value: string;
    onValueChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    renderTab?: Tabs.TabProps['render'];
    renderTabsList?: Tabs.ListProps['render'];
  };
}

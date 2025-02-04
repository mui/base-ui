'use client';
import * as React from 'react';
import { ExperimentRootContext } from './ExperimentRoot';
import { Button } from './Button';

export function HideSidebar(props: React.HTMLAttributes<HTMLDivElement>) {
  const rootContext = React.useContext(ExperimentRootContext);
  if (!rootContext) {
    return null;
  }

  return (
    <div {...props}>
      <h2>Sidebar visibility</h2>
      <Button
        onClick={() => rootContext.setSidebarVisible(false)}
        variant="text"
        fullWidth
        tooltip="Refresh the page to show the sidebar again."
      >
        Hide sidebar
      </Button>
    </div>
  );
}

'use client';
import * as React from 'react';
import clsx from 'clsx';
import classes from '../page.module.css';

export interface ExperimentRootContext {
  sidebarVisible: boolean;
  setSidebarVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ExperimentRootContext = React.createContext<
  ExperimentRootContext | undefined
>(undefined);

export function ExperimentRoot(props: ExperimentRootProps) {
  const { children, sidebar } = props;
  const [sidebarVisible, setSidebarVisible] = React.useState(true);

  const context = React.useMemo(
    () => ({
      sidebarVisible,
      setSidebarVisible,
    }),
    [sidebarVisible],
  );

  return (
    <ExperimentRootContext value={context}>
      <div className={clsx(classes.root, sidebarVisible && classes.withSidebar)}>
        {sidebarVisible ? sidebar : null}
        <main className={classes.main}>{children}</main>
      </div>
    </ExperimentRootContext>
  );
}

export interface ExperimentRootProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

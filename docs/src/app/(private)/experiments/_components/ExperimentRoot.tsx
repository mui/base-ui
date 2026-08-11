'use client';
import * as React from 'react';
import clsx from 'clsx';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { ShowSidebar } from './ShowSidebar';
import classes from './ExperimentRoot.module.css';

export interface ExperimentRootContext {
  setSidebarVisible: (visible: boolean) => void;
}

export const ExperimentRootContext = React.createContext<ExperimentRootContext | undefined>(
  undefined,
);

// Shared by all experiments rather than stored per experiment, so that hiding the sidebar keeps
// it hidden while moving between them.
const STORAGE_KEY = 'base-ui-experiments-sidebar';

export function ExperimentRoot(props: ExperimentRootProps) {
  const { children, sidebar } = props;

  // The sidebar is rendered on the client only, so the stored visibility is applied on the very
  // first render it takes part in instead of hiding a sidebar that was already painted. It stays
  // `null` until read from session storage in a layout effect, which is what the server renders
  // too. The experiment itself is outside of this and keeps its server-rendered markup.
  const [sidebarVisible, setSidebarVisible] = React.useState<boolean | null>(null);

  useIsoLayoutEffect(() => {
    setSidebarVisible(readStoredSidebarVisible());
  }, []);

  const changeSidebarVisible = useStableCallback((visible: boolean) => {
    setSidebarVisible(visible);
    storeSidebarVisible(visible);
  });

  const rootContext = React.useMemo(
    () => ({ setSidebarVisible: changeSidebarVisible }),
    [changeSidebarVisible],
  );

  return (
    <ExperimentRootContext value={rootContext}>
      {/*
       * The space for the sidebar is kept until it is known to be hidden, so that the experiment
       * doesn't shift sideways in the common case of a sidebar that turns out to be visible.
       */}
      <div className={clsx(classes.root, sidebarVisible !== false && classes.withSidebar)}>
        {sidebarVisible === true && sidebar}
        {sidebarVisible === false && <ShowSidebar />}
        <main className={classes.main}>{children}</main>
      </div>
    </ExperimentRootContext>
  );
}

function readStoredSidebarVisible() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== 'hidden';
  } catch (error) {
    console.warn('Could not read the sidebar visibility from session storage.', error);
    return true;
  }
}

function storeSidebarVisible(visible: boolean) {
  try {
    if (visible) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, 'hidden');
    }
  } catch (error) {
    console.warn('Could not save the sidebar visibility to session storage.', error);
  }
}

export interface ExperimentRootProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

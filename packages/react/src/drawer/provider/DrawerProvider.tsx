'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { DrawerProviderContext } from './DrawerProviderContext';

/**
 * Provides a shared context for coordinating global Drawer UI,
 * such as indent/background effects based on whether any Drawer is open.
 */
export const DrawerProvider: React.FC<DrawerProvider.Props> = function DrawerProvider(props) {
  const { children } = props;

  const [openById, setOpenById] = React.useState(() => new Map<string, boolean>());

  const setDrawerOpen = useStableCallback((drawerId: string, open: boolean) => {
    setOpenById((prev) => {
      const prevOpen = prev.get(drawerId);
      if (prevOpen === open) {
        return prev;
      }
      const next = new Map(prev);
      next.set(drawerId, open);
      return next;
    });
  });

  const removeDrawer = useStableCallback((drawerId: string) => {
    setOpenById((prev) => {
      if (!prev.has(drawerId)) {
        return prev;
      }
      const next = new Map(prev);
      next.delete(drawerId);
      return next;
    });
  });

  const active = React.useMemo(() => {
    for (const open of openById.values()) {
      if (open) {
        return true;
      }
    }
    return false;
  }, [openById]);

  const contextValue = React.useMemo(
    () => ({ setDrawerOpen, removeDrawer, active }),
    [active, removeDrawer, setDrawerOpen],
  );

  return (
    <DrawerProviderContext.Provider value={contextValue}>{children}</DrawerProviderContext.Provider>
  );
};

export interface DrawerProviderProps {
  children?: React.ReactNode;
}

export namespace DrawerProvider {
  export type Props = DrawerProviderProps;
}

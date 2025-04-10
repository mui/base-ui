import * as React from 'react';

export function useMenubarRoot(): useMenubarRoot.ReturnValue {
  const [contentElement, setContentElement] = React.useState<HTMLElement | null>(null);
  const [hasSubmenuOpen, setHasSubmenuOpen] = React.useState(false);

  return React.useMemo(
    () => ({
      contentElement,
      setContentElement,
      hasSubmenuOpen,
      setHasSubmenuOpen,
    }),
    [contentElement, hasSubmenuOpen],
  );
}

export namespace useMenubarRoot {
  export interface ReturnValue {
    contentElement: HTMLElement | null;
    setContentElement: (element: HTMLElement | null) => void;
    hasSubmenuOpen: boolean;
    setHasSubmenuOpen: (open: boolean) => void;
  }
}

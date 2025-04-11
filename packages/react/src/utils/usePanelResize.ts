'use client';
import * as React from 'react';
import { ownerWindow } from './owner';

export function usePanelResize(
  panelRef: React.RefObject<HTMLElement | null>,
  setDimensions: (dimensions: { height: number; width: number }) => void,
  shouldRender: boolean,
) {
  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return undefined;
    }

    // Ensures the panel will expand to the correct height when the window is resized.
    // This prevents content from being cut off or the panel not fitting to the content.
    function handleWindowResize() {
      if (panel) {
        const originalHeight = panel.style.height;
        panel.style.height = 'auto';
        setDimensions({ height: panel.scrollHeight, width: panel.scrollWidth });
        panel.style.height = originalHeight;
      }
    }

    const win = ownerWindow(panel);
    win.addEventListener('resize', handleWindowResize);
    return () => {
      win.removeEventListener('resize', handleWindowResize);
    };
  }, [panelRef, setDimensions, shouldRender]);
}

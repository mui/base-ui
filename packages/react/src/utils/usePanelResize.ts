'use client';
import * as React from 'react';
import { ownerWindow } from './owner';

export function usePanelResize(
  panelRef: React.RefObject<HTMLElement | null>,
  setDimensions: (dimensions: { height: number; width: number }) => void,
  open: boolean,
) {
  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !open) {
      return undefined;
    }

    // Ensures the panel will expand to the correct height when the window is resized.
    // This prevents content from being cut off or the panel not fitting to the content.
    function handleWindowResize() {
      if (panel) {
        const originalHeight = panel.style.height;
        const originalWidth = panel.style.width;
        panel.style.height = 'auto';
        panel.style.width = 'auto';
        setDimensions({ height: panel.scrollHeight, width: panel.scrollWidth });
        panel.style.height = originalHeight;
        panel.style.width = originalWidth;
      }
    }

    const win = ownerWindow(panel);
    win.addEventListener('resize', handleWindowResize);
    return () => {
      win.removeEventListener('resize', handleWindowResize);
    };
  }, [panelRef, setDimensions, open]);
}

'use client';
import * as React from 'react';
import { ownerWindow } from './owner';
import { Dimensions } from '../collapsible/root/useCollapsibleRoot';

function setAutoSize(panel: HTMLElement) {
  const originalHeight = panel.style.height;
  const originalWidth = panel.style.width;
  panel.style.height = 'auto';
  panel.style.width = 'auto';
  return () => {
    panel.style.height = originalHeight;
    panel.style.width = originalWidth;
  };
}

/**
 * Ensures the panel will expand to the correct height when the window is resized.
 * This prevents content from being cut off or the panel not fitting to the content.
 */
export function usePanelResize(
  panelRef: React.RefObject<HTMLElement | null>,
  setDimensions: React.Dispatch<React.SetStateAction<Dimensions>>,
  open: boolean,
) {
  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !open || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    function recalculateSize() {
      if (!panel) {
        return;
      }
      const cleanup = setAutoSize(panel);
      const scrollHeight = panel.scrollHeight;
      const scrollWidth = panel.scrollWidth;
      cleanup();

      setDimensions((prev) => {
        if (prev.height !== scrollHeight || prev.width !== scrollWidth) {
          return { height: scrollHeight, width: scrollWidth };
        }
        return prev;
      });
    }

    const observer = new ResizeObserver(() => {
      if (panel.getAnimations().length > 0) {
        return;
      }
      recalculateSize();
    });

    function handleWindowResize() {
      if (panel) {
        recalculateSize();
      }
    }

    const win = ownerWindow(panel);
    win.addEventListener('resize', handleWindowResize);
    observer.observe(panel);
    return () => {
      observer.disconnect();
      win.removeEventListener('resize', handleWindowResize);
    };
  }, [panelRef, setDimensions, open]);
}

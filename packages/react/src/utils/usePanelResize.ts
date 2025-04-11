'use client';
import * as React from 'react';
import { ownerWindow } from './owner';

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
  setDimensions: React.Dispatch<React.SetStateAction<{ height: number; width: number }>>,
  open: boolean,
) {
  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !open) {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      if (panel.getAnimations().length > 0) {
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
    });

    let frame = -1;

    function handleWindowResize() {
      // Avoid size transitions when the window is resized.
      if (panel) {
        cancelAnimationFrame(frame);
        const cleanup = setAutoSize(panel);
        frame = requestAnimationFrame(cleanup);
      }
    }

    const win = ownerWindow(panel);
    win.addEventListener('resize', handleWindowResize);
    observer.observe(panel);
    return () => {
      observer.disconnect();
      win.removeEventListener('resize', handleWindowResize);
      cancelAnimationFrame(frame);
    };
  }, [panelRef, setDimensions, open]);
}

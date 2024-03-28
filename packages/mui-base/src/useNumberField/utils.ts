import { ownerWindow } from '../utils/owner';

// This lets us invert the scale of the cursor to match the OS scale, in which the cursor doesn't
// scale with the content on pinch-zoom.
export function subscribeToVisualViewportResize(
  element: Element,
  visualScaleRef: React.MutableRefObject<number>,
) {
  const vV = ownerWindow(element).visualViewport;

  if (!vV) {
    return () => {};
  }

  function handleVisualResize() {
    if (vV) {
      visualScaleRef.current = vV.scale;
    }
  }

  vV.addEventListener('resize', handleVisualResize);

  return () => {
    vV.removeEventListener('resize', handleVisualResize);
  };
}

// Calculates the viewport rect for the virtual cursor.
export function getViewportRect(teleportDistance: number | undefined, scrubAreaEl: HTMLElement) {
  const win = ownerWindow(scrubAreaEl);
  const rect = scrubAreaEl.getBoundingClientRect();

  if (rect && teleportDistance != null) {
    return {
      x: rect.left - teleportDistance / 2,
      y: rect.top - teleportDistance / 2,
      width: rect.right + teleportDistance / 2,
      height: rect.bottom + teleportDistance / 2,
    };
  }

  const vV = win.visualViewport;

  if (vV) {
    return {
      x: vV.offsetLeft,
      y: vV.offsetTop,
      width: vV.offsetLeft + vV.width,
      height: vV.offsetTop + vV.height,
    };
  }

  return {
    x: 0,
    y: 0,
    width: win.document.documentElement.clientWidth,
    height: win.document.documentElement.clientHeight,
  };
}

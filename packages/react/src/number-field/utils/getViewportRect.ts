import { ownerWindow } from '@base-ui/utils/owner';

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

import { ownerWindow } from '@base-ui/utils/owner';

// Within a column, the candidate insertion slots are:
//   index 0      — above the first card
//   index 1..n-1 — between consecutive cards (midpoint of the gap)
//   index n      — below the last card
// Measure insertion slots without the placeholder's displacement so the preview
// and release keep resolving to the same position while the pointer is still.
export function findClosestSlot(columnEl: HTMLElement, clientY: number): number {
  const body = columnEl.querySelector('[data-column-body]') as HTMLElement | null;
  const scope = body ?? columnEl;
  // The dragged card's preview is a clone injected next to it, and it carries the
  // same `data-card`. Skip it: it follows the pointer and is not a real slot.
  const cardEls = Array.from(
    scope.querySelectorAll('[data-card]:not([data-drag-preview])'),
  ) as HTMLElement[];

  if (cardEls.length === 0) {
    return 0;
  }

  const placeholder = scope.querySelector('[data-placeholder]');
  const placeholderRect = placeholder?.getBoundingClientRect();
  const gap = Number.parseFloat(ownerWindow(scope).getComputedStyle(scope).rowGap) || 0;
  const rects = cardEls.map((card) => {
    const rect = card.getBoundingClientRect();
    const displacement =
      placeholderRect && rect.top >= placeholderRect.bottom ? placeholderRect.height + gap : 0;
    return { top: rect.top - displacement, bottom: rect.bottom - displacement };
  });
  const slotYs = [rects[0].top];
  for (let i = 1; i < rects.length; i += 1) {
    slotYs.push((rects[i - 1].bottom + rects[i].top) / 2);
  }
  slotYs.push(rects[rects.length - 1].bottom);

  let bestIndex = 0;
  let bestDy = Infinity;
  for (let i = 0; i < slotYs.length; i += 1) {
    const dy = Math.abs(clientY - slotYs[i]);
    if (dy < bestDy) {
      bestDy = dy;
      bestIndex = i;
    }
  }
  return bestIndex;
}

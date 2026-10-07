import { ownerWindow } from '@base-ui/utils/owner';

// Insertion slots sit above the first card, mid-gap between cards, and below the last
// card. They're measured without the placeholder's displacement, so the preview and the
// release resolve to the same slot while the pointer is still.
export function findClosestSlot(columnEl: HTMLElement, clientY: number): number {
  const body = columnEl.querySelector('[data-column-body]') as HTMLElement | null;
  const scope = body ?? columnEl;
  // Skip the drag preview: it's a clone of a card, so it has `data-card` too.
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

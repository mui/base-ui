'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';

/** Animate the cards inside stationary collision rows after their order changes. */
export function useSortableAnimation(items: readonly string[]) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const positions = React.useRef(new Map<Element, number>());
  const animations = React.useRef(new Map<Element, Animation>());

  useIsoLayoutEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    const reduceMotion = ownerWindow(list).matchMedia('(prefers-reduced-motion: reduce)').matches;
    const listTop = list.getBoundingClientRect().top;
    const nextPositions = new Map<Element, number>();
    for (const row of list.children) {
      const item = row.querySelector<HTMLElement>('[data-sortable-item]');
      if (!item) {
        continue;
      }
      const rowTop = row.getBoundingClientRect().top;
      // Page scrolling and layout shifts must not change the stored row position.
      const top = rowTop - listTop;
      const previousTop = positions.current.get(row);
      // Include an unfinished animation's offset so rapid reorders don't jump.
      const offset = item.getBoundingClientRect().top - rowTop;
      animations.current.get(item)?.cancel();
      animations.current.delete(item);
      nextPositions.set(row, top);
      if (previousTop === undefined || reduceMotion || item.hasAttribute('data-dragging')) {
        continue;
      }
      const delta = previousTop - top + offset;
      if (delta !== 0) {
        animations.current.set(
          item,
          item.animate([{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }], {
            duration: 200,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
          }),
        );
      }
    }
    positions.current = nextPositions;
  }, [items]);

  useIsoLayoutEffect(() => {
    const active = animations.current;
    return () => {
      active.forEach((animation) => animation.cancel());
      active.clear();
    };
  }, []);

  return listRef;
}

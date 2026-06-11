import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { getSide } from '@floating-ui/utils';
import { Middleware } from '../floating-ui-react';
import { DEFAULT_SIDES } from './useAnchorPositioning';

// Tracks the inset properties last used to position each floating element so that a
// swap (e.g. `bottom` -> `top`) can be detected when the rendered side changes.
const prevSidesMap = new WeakMap<
  HTMLElement,
  { sideX: 'left' | 'right'; sideY: 'top' | 'bottom' }
>();

export const adaptiveOrigin: Middleware = {
  name: 'adaptiveOrigin',
  async fn(state) {
    const {
      x: rawX,
      y: rawY,
      rects: { floating: floatRect },
      elements: { floating },
      platform,
      strategy,
      placement,
    } = state;

    const win = ownerWindow(floating);
    const styles = win.getComputedStyle(floating);
    const hasTransition = styles.transitionDuration !== '0s' && styles.transitionDuration !== '';

    if (!hasTransition) {
      prevSidesMap.set(floating, DEFAULT_SIDES);
      return {
        x: rawX,
        y: rawY,
        data: DEFAULT_SIDES,
      };
    }

    const offsetParent = await platform.getOffsetParent?.(floating);

    let offsetDimensions = { width: 0, height: 0 };

    // For fixed strategy, prefer visualViewport if available
    if (strategy === 'fixed' && win?.visualViewport) {
      offsetDimensions = {
        width: win.visualViewport.width,
        height: win.visualViewport.height,
      };
    } else if (offsetParent === win) {
      const doc = ownerDocument(floating);
      offsetDimensions = {
        width: doc.documentElement.clientWidth,
        height: doc.documentElement.clientHeight,
      };
    } else if (await platform.isElement?.(offsetParent)) {
      offsetDimensions = await platform.getDimensions(offsetParent);
    }

    const currentSide = getSide(placement);
    let x = rawX;
    let y = rawY;

    if (currentSide === 'left') {
      x = offsetDimensions.width - (rawX + floatRect.width);
    }
    if (currentSide === 'top') {
      y = offsetDimensions.height - (rawY + floatRect.height);
    }

    const sideX = currentSide === 'left' ? 'right' : DEFAULT_SIDES.sideX;
    const sideY = currentSide === 'top' ? 'bottom' : DEFAULT_SIDES.sideY;

    const prevSides = prevSidesMap.get(floating);
    prevSidesMap.set(floating, { sideX, sideY });

    if (prevSides && (prevSides.sideX !== sideX || prevSides.sideY !== sideY)) {
      // The inset properties used for positioning are about to swap (e.g. `bottom` -> `top`).
      // CSS transitions can't interpolate from `auto`, so the move would jump. Before the new
      // styles land, re-express the current visual position (resolved from the computed styles,
      // including mid-transition values) in the new properties so the transition has a numeric
      // starting point to animate from.
      const fromX = parseFloat(styles[sideX]);
      const fromY = parseFloat(styles[sideY]);
      if (Number.isFinite(fromX) && Number.isFinite(fromY)) {
        const floatingStyle = floating.style;
        floatingStyle[prevSides.sideX] = '';
        floatingStyle[prevSides.sideY] = '';
        floatingStyle[sideX] = `${fromX}px`;
        floatingStyle[sideY] = `${fromY}px`;
        // Flush styles so the starting position is committed before the new styles apply.
        floating.offsetWidth; // eslint-disable-line @typescript-eslint/no-unused-expressions
      }
    }

    return {
      x,
      y,
      data: {
        sideX,
        sideY,
      },
    };
  },
};

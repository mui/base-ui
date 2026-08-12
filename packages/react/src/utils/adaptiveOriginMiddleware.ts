import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { getSide } from '@floating-ui/utils';
import { Middleware } from '../floating-ui-react';
import { DEFAULT_SIDES } from './adaptiveOriginConstants';

interface PrevPositioning {
  side: string;
  width: number;
  height: number;
  anchor: unknown;
  movingUntil: number;
}

// Last committed positioning per floating element, used to detect anchor moves and
// rendered side changes.
const prevPositioningMap = new WeakMap<HTMLElement, PrevPositioning>();

function getMaxTransitionTime(styles: CSSStyleDeclaration): number {
  const parseList = (list: string) =>
    Math.max(...list.split(',').map((value) => parseFloat(value) || 0), 0);
  return (parseList(styles.transitionDuration) + parseList(styles.transitionDelay)) * 1000;
}

export const adaptiveOrigin: Middleware = {
  name: 'adaptiveOrigin',
  async fn(state) {
    const {
      x: rawX,
      y: rawY,
      rects: { floating: floatRect },
      elements: { floating, reference },
      platform,
      strategy,
      placement,
    } = state;

    const win = ownerWindow(floating);
    const styles = win.getComputedStyle(floating);
    const hasTransition = styles.transitionDuration !== '0s' && styles.transitionDuration !== '';
    const currentSide = getSide(placement);

    const prev = prevPositioningMap.get(floating);
    const anchorChanged = prev != null && prev.anchor !== reference;
    const sideChanged = prev != null && prev.side !== currentSide;
    // Position transitions animate anchor moves only; collision flips outside a move
    // apply instantly, and tracking updates (scroll/resize) apply instantly by
    // suppressing the transition via the `transition-property` longhand, which keeps
    // the `transition-duration` read above truthful. The move window is time-bound:
    // chaining on a running transition instead would never end, since scroll
    // retargets restart the transition. A flip during the window is part of the move
    // and extends it so its animation can finish.
    const now = Date.now();
    let movingUntil = prev ? prev.movingUntil : 0;
    if (anchorChanged || (sideChanged && now < movingUntil)) {
      movingUntil = now + getMaxTransitionTime(styles);
    }
    const moving = now < movingUntil;
    prevPositioningMap.set(floating, {
      side: currentSide,
      width: floatRect.width,
      height: floatRect.height,
      anchor: reference,
      movingUntil,
    });

    if (hasTransition) {
      floating.style.transitionProperty = moving ? '' : 'none';
    }

    if (!hasTransition) {
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

    let x = rawX;
    let y = rawY;

    if (currentSide === 'left') {
      x = offsetDimensions.width - (rawX + floatRect.width);
    }
    if (currentSide === 'top') {
      y = offsetDimensions.height - (rawY + floatRect.height);
    }

    const sideX = currentSide === 'left' ? 'right' : 'left';
    const sideY = currentSide === 'top' ? 'bottom' : 'top';

    // A side change may swap the positioning inset (e.g. `bottom` -> `top`), which CSS
    // can't transition from `auto`. Commit the current visual position in the new
    // properties so the transition continues from where the popup is.
    if (prev && moving && sideChanged) {
      const swappedX = (prev.side === 'left') !== (currentSide === 'left');
      const swappedY = (prev.side === 'top') !== (currentSide === 'top');
      // An anchor change may commit a new popup size before this update runs. On a
      // swapped axis that shifts the captured inset by the size delta; compensate.
      const fromX = swappedX
        ? parseFloat(styles[sideX]) + (anchorChanged ? floatRect.width - prev.width : 0)
        : 0;
      const fromY = swappedY
        ? parseFloat(styles[sideY]) + (anchorChanged ? floatRect.height - prev.height : 0)
        : 0;
      if ((swappedX || swappedY) && Number.isFinite(fromX) && Number.isFinite(fromY)) {
        const floatingStyle = floating.style;
        if (swappedX) {
          floatingStyle.right = '';
          floatingStyle.left = '';
          floatingStyle[sideX] = `${fromX}px`;
        }
        if (swappedY) {
          floatingStyle.top = '';
          floatingStyle.bottom = '';
          floatingStyle[sideY] = `${fromY}px`;
        }
        // Commit the intermediate position before the new styles apply.
        floating.getBoundingClientRect();
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

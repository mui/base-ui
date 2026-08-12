import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { getSide } from '@floating-ui/utils';
import { Middleware } from '../floating-ui-react';
import { DEFAULT_SIDES } from './adaptiveOriginConstants';

interface PrevPositioning {
  side: string;
  width: number;
  height: number;
  anchor: unknown;
  moving: boolean;
}

// Last committed positioning per floating element, used to detect rendered side changes.
const prevPositioningMap = new WeakMap<HTMLElement, PrevPositioning>();

const INSET_PROPERTIES = ['top', 'right', 'bottom', 'left'];

function hasRunningInsetTransition(floating: HTMLElement): boolean {
  // `getAnimations` is unavailable in jsdom.
  return Boolean(
    floating
      .getAnimations?.()
      .some(
        (animation) =>
          animation.playState === 'running' &&
          INSET_PROPERTIES.includes((animation as CSSTransition).transitionProperty),
      ),
  );
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
    // Same-anchor scrolling also starts inset transitions, so a running transition only
    // indicates an anchor move while it chains back to an anchor change.
    const moving =
      anchorChanged || (prev != null && prev.moving && hasRunningInsetTransition(floating));
    prevPositioningMap.set(floating, {
      side: currentSide,
      width: floatRect.width,
      height: floatRect.height,
      anchor: reference,
      moving,
    });

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
    // can't transition from `auto`. Mid anchor move, commit the current visual position
    // in the new properties so the transition continues from where the popup is.
    if (prev && moving && prev.side !== currentSide) {
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

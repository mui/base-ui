import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { getSide } from '@floating-ui/utils';
import { Middleware } from '../floating-ui-react';
import { DEFAULT_SIDES } from './useAnchorPositioning';

// A nameable interface so store fields holding the middleware can be emitted in
// declarations without expanding Floating UI's structural `Middleware` type.
export interface AdaptiveOriginMiddleware extends Middleware {}

interface PrevPositioning {
  side: string;
  sideX: 'left' | 'right';
  sideY: 'top' | 'bottom';
  width: number;
  height: number;
  anchor: unknown;
}

// Tracks how each floating element was last positioned so that a swap of the inset
// properties (e.g. `bottom` -> `top`) caused by an anchor change can be detected.
const prevPositioningMap = new WeakMap<HTMLElement, PrevPositioning>();

const INSET_PROPERTIES = new Set(['top', 'right', 'bottom', 'left']);

function hasRunningInsetTransition(floating: HTMLElement): boolean {
  const win = ownerWindow(floating);
  return floating
    .getAnimations()
    .some(
      (animation) =>
        animation instanceof win.CSSTransition &&
        animation.playState === 'running' &&
        INSET_PROPERTIES.has((animation as CSSTransition).transitionProperty),
    );
}

export const adaptiveOrigin: AdaptiveOriginMiddleware = {
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

    if (!hasTransition) {
      prevPositioningMap.set(floating, {
        ...DEFAULT_SIDES,
        side: currentSide,
        width: floatRect.width,
        height: floatRect.height,
        anchor: reference,
      });
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

    const sideX = currentSide === 'left' ? 'right' : DEFAULT_SIDES.sideX;
    const sideY = currentSide === 'top' ? 'bottom' : DEFAULT_SIDES.sideY;

    const prev = prevPositioningMap.get(floating);
    prevPositioningMap.set(floating, {
      side: currentSide,
      sideX,
      sideY,
      width: floatRect.width,
      height: floatRect.height,
      anchor: reference,
    });

    const swappedX = prev != null && prev.sideX !== sideX;
    const swappedY = prev != null && prev.sideY !== sideY;
    const anchorChanged = prev != null && prev.anchor !== reference;
    const sideChanged = prev != null && prev.side !== currentSide;

    // When the rendered side changes or the inset properties used for positioning swap
    // (e.g. `bottom` -> `top`), commit an intermediate state so the outcome doesn't depend
    // on how updates batch within a frame:
    // - While the popup is moving to a new anchor (including collision flips from interim
    //   updates during the move), commit the current visual position expressed in the new
    //   properties so the transition continues from where the popup is.
    // - Otherwise (a steady-state collision flip, for example), commit the target position
    //   with transitions disabled so the flip applies instantly instead of gliding across
    //   the anchor.
    if (prev && (swappedX || swappedY || sideChanged)) {
      const animate = anchorChanged || hasRunningInsetTransition(floating);
      let fromX = x;
      let fromY = y;
      if (animate) {
        // When the anchor changes, the popup's size may have been committed before this
        // update runs. On a swapped axis the popup is anchored at the opposite edge, so the
        // size change shifted the captured inset by the size delta. Compensate so the
        // popup's visible content starts from its last painted position.
        fromX =
          parseFloat(styles[sideX]) +
          (swappedX && anchorChanged ? floatRect.width - prev.width : 0);
        fromY =
          parseFloat(styles[sideY]) +
          (swappedY && anchorChanged ? floatRect.height - prev.height : 0);
      }
      if (Number.isFinite(fromX) && Number.isFinite(fromY)) {
        const floatingStyle = floating.style;
        const inlineTransition = floatingStyle.transition;
        if (!animate) {
          floatingStyle.transition = 'none';
        }
        floatingStyle[prev.sideX] = '';
        floatingStyle[prev.sideY] = '';
        floatingStyle[sideX] = `${fromX}px`;
        floatingStyle[sideY] = `${fromY}px`;
        // Flush styles so the intermediate position is committed before the new styles apply.
        floating.getBoundingClientRect();
        if (!animate) {
          floatingStyle.transition = inlineTransition;
        }
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

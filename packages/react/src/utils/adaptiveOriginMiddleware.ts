import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { getSide } from '@floating-ui/utils';
import { Middleware } from '../floating-ui-react';
import { DEFAULT_SIDES } from './adaptiveOriginConstants';

interface PrevPositioning {
  side: string;
  width: number;
  height: number;
  anchor: unknown;
}

// Tracks how each floating element was last positioned so that a rendered side
// change (which swaps the inset properties used for positioning) can be detected.
const prevPositioningMap = new WeakMap<HTMLElement, PrevPositioning>();

const INSET_PROPERTIES = ['top', 'right', 'bottom', 'left'];

function hasRunningInsetTransition(floating: HTMLElement): boolean {
  return floating
    .getAnimations()
    .some(
      (animation) =>
        animation.playState === 'running' &&
        INSET_PROPERTIES.includes((animation as CSSTransition).transitionProperty),
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
    prevPositioningMap.set(floating, {
      side: currentSide,
      width: floatRect.width,
      height: floatRect.height,
      anchor: reference,
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

    // When the rendered side changes, the inset properties used for positioning may swap
    // (e.g. `bottom` -> `top`), which CSS can't transition from `auto`. Commit an
    // intermediate state so the outcome doesn't depend on how updates batch within a frame:
    // - While the popup is moving to a new anchor (including collision flips from interim
    //   updates during the move), commit the current visual position expressed in the new
    //   properties so the transition continues from where the popup is.
    // - Otherwise (a steady-state collision flip, for example), commit the target position
    //   with transitions disabled so the flip applies instantly instead of gliding across
    //   the anchor.
    if (prev && prev.side !== currentSide) {
      const anchorChanged = prev.anchor !== reference;
      const animate = anchorChanged || hasRunningInsetTransition(floating);
      const swappedX = (prev.side === 'left') !== (currentSide === 'left');
      const swappedY = (prev.side === 'top') !== (currentSide === 'top');
      const updateX = !animate || swappedX;
      const updateY = !animate || swappedY;
      let fromX = x;
      let fromY = y;
      if (animate) {
        // When the anchor changes, the popup's size may have been committed before this
        // update runs. On a swapped axis the popup is anchored at the opposite edge, so the
        // size change shifted the captured inset by the size delta. Compensate so the
        // popup's visible content starts from its last painted position.
        if (swappedX) {
          fromX = parseFloat(styles[sideX]) + (anchorChanged ? floatRect.width - prev.width : 0);
        }
        if (swappedY) {
          fromY = parseFloat(styles[sideY]) + (anchorChanged ? floatRect.height - prev.height : 0);
        }
      }
      if (
        (updateX || updateY) &&
        (!updateX || Number.isFinite(fromX)) &&
        (!updateY || Number.isFinite(fromY))
      ) {
        const floatingStyle = floating.style;
        // Override the `transition-duration` longhand rather than the `transition`
        // shorthand, which would clear any transition longhands set inline by consumers.
        const inlineDuration = floatingStyle.getPropertyValue('transition-duration');
        const inlineDurationPriority = floatingStyle.getPropertyPriority('transition-duration');
        if (!animate) {
          floatingStyle.setProperty('transition-duration', '0s');
        }
        if (updateX) {
          floatingStyle.right = '';
          floatingStyle.left = '';
          floatingStyle[sideX] = `${fromX}px`;
        }
        if (updateY) {
          floatingStyle.top = '';
          floatingStyle.bottom = '';
          floatingStyle[sideY] = `${fromY}px`;
        }
        // Flush styles so the intermediate position is committed before the new styles apply.
        floating.getBoundingClientRect();
        if (!animate) {
          if (inlineDuration) {
            floatingStyle.setProperty(
              'transition-duration',
              inlineDuration,
              inlineDurationPriority,
            );
          } else {
            floatingStyle.removeProperty('transition-duration');
          }
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

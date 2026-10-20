import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { getSide } from '@floating-ui/utils';
import type { Middleware } from '@floating-ui/react-dom';
import { DEFAULT_SIDES } from './adaptiveOriginConstants';

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

    if (!hasTransition(floating, win)) {
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

function isTransitioned(styles: CSSStyleDeclaration) {
  return styles.transitionDuration !== '0s' && styles.transitionDuration !== '';
}

/**
 * Checks for a transition without the `[data-instant]` styles or the inline `transition: none`
 * that disable it for a moment.
 */
function hasTransition(floating: HTMLElement, win: Window) {
  const styles = win.getComputedStyle(floating);
  if (isTransitioned(styles)) {
    return true;
  }

  const instant = floating.getAttribute('data-instant');
  const inlineNone = floating.style.transitionProperty === 'none';
  if (instant === null && !inlineNone) {
    return false;
  }

  // The read above applied all pending styles, so this toggle cannot start a transition.
  const inlineStyle = floating.style.cssText;
  if (instant !== null) {
    floating.removeAttribute('data-instant');
  }
  if (inlineNone) {
    floating.style.removeProperty('transition');
  }
  const result = isTransitioned(styles);
  if (instant !== null) {
    floating.setAttribute('data-instant', instant);
  }
  if (inlineNone) {
    floating.style.cssText = inlineStyle;
  }
  return result;
}

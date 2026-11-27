import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { getSide } from '@floating-ui/utils';
import { isHTMLElement } from '@floating-ui/utils/dom';
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
    // Keep the anchor-facing inset stable when position transitions are toggled.
    // Switching between top/left and bottom/right would make the next move jump.
    const offsetParent = await platform.getOffsetParent?.(floating);

    let offsetDimensions = { width: 0, height: 0 };

    if (isHTMLElement(offsetParent)) {
      // Insets use the containing block's padding box, including for fixed popups.
      offsetDimensions = {
        width: offsetParent.clientWidth,
        height: offsetParent.clientHeight,
      };
    } else if (offsetParent === win) {
      const doc = ownerDocument(floating);
      const viewport = strategy === 'fixed' ? win.visualViewport : null;
      offsetDimensions = {
        width: viewport?.width ?? doc.documentElement.clientWidth,
        height: viewport?.height ?? doc.documentElement.clientHeight,
      };
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

import { platform } from '@floating-ui/react-dom';
import type { Platform, Rect } from '@floating-ui/react-dom';
import { isElement } from '@floating-ui/utils/dom';

/**
 * Returns how many viewport pixels one CSS pixel of the positioner covers when its offset parent
 * is the window (top layer, `fixed` without a containing block, or a static `<body>`).
 * Floating UI scales coordinates by the offset parent's zoom or transform only when the offset
 * parent is an element, so an ancestor CSS `zoom` is otherwise ignored for a window offset parent.
 */
async function getWindowOffsetParentZoom(floating: Element | null) {
  // Browsers without standardized CSS zoom don't expose `currentCSSZoom`.
  const zoom = floating?.currentCSSZoom ?? 1;
  // Check the zoom first so unzoomed positioners skip the offset parent lookup.
  if (!floating || zoom === 1) {
    return 1;
  }
  const offsetParent = await platform.getOffsetParent(floating);
  return isElement(offsetParent) ? 1 : zoom;
}

function scaleRect(rect: Rect, scale: number): Rect {
  return {
    x: rect.x * scale,
    y: rect.y * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}

/**
 * Floating UI's DOM platform, treating a window offset parent like an element offset parent
 * scaled by the positioner's zoom. Rects are converted into the positioner's CSS pixels, the
 * units its position styles are written in.
 */
export function createZoomAwarePlatform(floating: Element | null): Platform {
  // Floating UI calls these with `this` set to its platform copy, which carries the per-call
  // measurement cache, so forward `this` to the original methods.
  return {
    ...platform,
    async getElementRects(this: Platform, args) {
      const rects = await platform.getElementRects.call(this, args);
      const zoom = await getWindowOffsetParentZoom(floating);
      if (zoom === 1) {
        return rects;
      }
      return { ...rects, reference: scaleRect(rects.reference, 1 / zoom) };
    },
    async getClippingRect(this: Platform, args) {
      const clippingRect = await platform.getClippingRect.call(this, args);
      const zoom = await getWindowOffsetParentZoom(floating);
      return zoom === 1 ? clippingRect : scaleRect(clippingRect, 1 / zoom);
    },
    async convertOffsetParentRelativeRectToViewportRelativeRect(this: Platform, args) {
      const zoom = await getWindowOffsetParentZoom(floating);
      if (zoom === 1) {
        return platform.convertOffsetParentRelativeRectToViewportRelativeRect.call(this, args);
      }
      // Convert in viewport pixels, then back into the positioner's CSS pixels so the result can
      // be compared with the scaled clipping rect.
      const viewportRect =
        await platform.convertOffsetParentRelativeRectToViewportRelativeRect.call(this, {
          ...args,
          rect: scaleRect(args.rect, zoom),
        });
      return scaleRect(viewportRect, 1 / zoom);
    },
  };
}

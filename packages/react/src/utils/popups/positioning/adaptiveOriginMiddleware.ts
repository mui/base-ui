import { getSide } from '@floating-ui/utils';
import type { Middleware } from '@floating-ui/react-dom';
import { DEFAULT_SIDES } from './adaptiveOriginConstants';

export const adaptiveOrigin: Middleware = {
  name: 'adaptiveOrigin',
  fn(state) {
    const {
      x,
      y,
      rects: { floating },
      placement,
    } = state;

    const side = getSide(placement);

    // Pin the anchor-facing edge while the popup resizes. The positioner converts top and
    // left placements to bottom and right insets relative to the containing block.
    return {
      x: side === 'left' ? x + floating.width : x,
      y: side === 'top' ? y + floating.height : y,
      data: {
        sideX: side === 'left' ? 'right' : DEFAULT_SIDES.sideX,
        sideY: side === 'top' ? 'bottom' : DEFAULT_SIDES.sideY,
      },
    };
  },
};

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

    // Keep the same inset when transitions are temporarily disabled. For top and left
    // placements, pass the anchor-facing edge to the positioner, which converts it to
    // a bottom or right inset relative to the containing block.
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

import { type Middleware } from '@floating-ui/react-dom';

export const hide: Middleware = {
  name: 'hide',
  async fn(state) {
    const { width, height, x, y } = state.rects.reference;
    const anchorHidden = width === 0 && height === 0 && x === 0 && y === 0;
    // Mirrors Floating UI's `hide()` referenceHidden strategy. Floating UI injects
    // `detectOverflow` into the middleware platform before invoking middleware.
    const overflow = await state.platform.detectOverflow(state, {
      elementContext: 'reference',
    });
    const referenceHidden =
      overflow.top - height >= 0 ||
      overflow.right - width >= 0 ||
      overflow.bottom - height >= 0 ||
      overflow.left - width >= 0;

    return {
      data: {
        referenceHidden: referenceHidden || anchorHidden,
      },
    };
  },
};

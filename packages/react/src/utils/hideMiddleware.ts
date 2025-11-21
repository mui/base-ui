import { hide as nativeHide, type Middleware } from '@floating-ui/react-dom';

export const hide: Middleware = {
  name: 'hide',
  async fn(state) {
    const anchorHidden = state.rects.reference.width === 0 && state.rects.reference.height === 0;
    const nativeHideResult = await nativeHide().fn(state);
    return {
      data: {
        referenceHidden: nativeHideResult.data?.referenceHidden || anchorHidden,
      },
    };
  },
};

import * as React from 'react';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';

const DialogTitle = React.forwardRef(function DialogTitle(
  props: React.ComponentPropsWithRef<'h2'>,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const rootProps = {
    ...props,
    ref: forwardedRef,
  };

  return defaultRenderFunctions.h2(rootProps);
});

export { DialogTitle };

import * as React from 'react';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';

const DialogDescription = React.forwardRef(function DialogDescription(
  props: React.ComponentPropsWithRef<'p'>,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const rootProps = {
    ...props,
    ref: forwardedRef,
  };

  return defaultRenderFunctions.p(rootProps);
});

export { DialogDescription };

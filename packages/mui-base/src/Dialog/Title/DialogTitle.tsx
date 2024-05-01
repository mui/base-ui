import * as React from 'react';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useId } from '../../utils/useId';

const DialogTitle = React.forwardRef(function DialogTitle(
  props: React.ComponentPropsWithRef<'h2'>,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const { id: idProp } = props;
  const { registerTitle } = useDialogRootContext();
  const id = useId(idProp);

  React.useEffect(() => {
    registerTitle(id ?? null);
    return () => {
      registerTitle(null);
    };
  }, [id, registerTitle]);

  const rootProps = {
    ...props,
    id,
    ref: forwardedRef,
  };

  return defaultRenderFunctions.h2(rootProps);
});

export { DialogTitle };

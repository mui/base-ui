import * as React from 'react';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useId } from '../../utils/useId';
import { useDialogRootContext } from '../Root/DialogRootContext';

const DialogDescription = React.forwardRef(function DialogDescription(
  props: React.ComponentPropsWithRef<'p'>,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { id: idProp } = props;
  const { registerDescription } = useDialogRootContext();
  const id = useId(idProp);

  React.useEffect(() => {
    registerDescription(id ?? null);
    return () => {
      registerDescription(null);
    };
  }, [id, registerDescription]);

  const rootProps = {
    ...props,
    id,
    ref: forwardedRef,
  };

  return defaultRenderFunctions.p(rootProps);
});

export { DialogDescription };

import * as React from 'react';
import PropTypes from 'prop-types';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useId } from '../../utils/useId';
import { useDialogRootContext } from '../Root/DialogRootContext';

const DialogDescription = React.forwardRef(function DialogDescription(
  props: React.ComponentPropsWithRef<'p'>,
  forwardedRef: React.ForwardedRef<HTMLParagraphElement>,
) {
  const { id: idProp } = props;
  const { setDescriptionElementId } = useDialogRootContext();
  const id = useId(idProp);

  React.useEffect(() => {
    setDescriptionElementId(id ?? null);
    return () => {
      setDescriptionElementId(null);
    };
  }, [id, setDescriptionElementId]);

  const rootProps = {
    ...props,
    id,
    ref: forwardedRef,
  };

  return defaultRenderFunctions.p(rootProps);
});

DialogDescription.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  id: PropTypes.string,
} as any;

export { DialogDescription };

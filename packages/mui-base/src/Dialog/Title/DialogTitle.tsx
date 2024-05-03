import * as React from 'react';
import PropTypes from 'prop-types';
import { useDialogRootContext } from '../Root/DialogRootContext';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useId } from '../../utils/useId';

const DialogTitle = React.forwardRef(function DialogTitle(
  props: React.ComponentPropsWithRef<'h2'>,
  forwardedRef: React.ForwardedRef<HTMLHeadingElement>,
) {
  const { id: idProp } = props;
  const { setTitleElementId } = useDialogRootContext();
  const id = useId(idProp);

  React.useEffect(() => {
    setTitleElementId(id ?? null);
    return () => {
      setTitleElementId(null);
    };
  }, [id, setTitleElementId]);

  const rootProps = {
    ...props,
    id,
    ref: forwardedRef,
  };

  return defaultRenderFunctions.h2(rootProps);
});

DialogTitle.propTypes /* remove-proptypes */ = {
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

export { DialogTitle };

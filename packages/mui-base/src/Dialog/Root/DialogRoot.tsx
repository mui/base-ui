import * as React from 'react';
import PropTypes from 'prop-types';
import { DialogRootProps } from './DialogRoot.types';
import { DialogRootContext, DialogRootContextValue } from './DialogRootContext';
import { useControlled } from '../../utils/useControlled';

const defaultRender = (props: React.PropsWithChildren<{ ref: React.Ref<HTMLElement> }>) => (
  // eslint-disable-next-line react/jsx-no-useless-fragment
  <React.Fragment>{props.children}</React.Fragment>
);

const DialogRoot = React.forwardRef(function DialogRoot(
  props: DialogRootProps,
  forwardedRef: React.Ref<HTMLElement>,
) {
  const { modal = true, onOpenChange, open: openProp, defaultOpen, ...other } = props;
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'DialogRoot',
  });

  const rootProps = {
    ...other,
    ref: forwardedRef,
  };

  const handleOpenChange = React.useCallback(
    (shouldOpen: boolean) => {
      setOpen(shouldOpen);
      onOpenChange?.(shouldOpen);
    },
    [onOpenChange, setOpen],
  );

  const contextValue: DialogRootContextValue = React.useMemo(() => {
    return {
      modal,
      onOpenChange: handleOpenChange,
      open,
    };
  }, [modal, handleOpenChange, open]);

  return (
    <DialogRootContext.Provider value={contextValue}>
      {defaultRender(rootProps)}
    </DialogRootContext.Provider>
  );
});

DialogRoot.propTypes /* remove-proptypes */ = {
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
  modal: PropTypes.bool,
  /**
   * @ignore
   */
  onOpenChange: PropTypes.func,
  /**
   * @ignore
   */
  open: PropTypes.bool,
} as any;

export { DialogRoot };

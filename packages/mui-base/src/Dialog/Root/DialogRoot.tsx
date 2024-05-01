import * as React from 'react';
import PropTypes from 'prop-types';
import { DialogRootProps } from './DialogRoot.types';
import { DialogRootContext, DialogRootContextValue } from './DialogRootContext';
import { useControlled } from '../../utils/useControlled';

const defaultRender = (props: React.PropsWithChildren<{ ref: React.Ref<HTMLElement> }>) => (
  // eslint-disable-next-line react/jsx-no-useless-fragment
  <React.Fragment {...props} />
);

const DialogRoot = React.forwardRef(function DialogRoot(
  props: DialogRootProps,
  forwardedRef: React.Ref<HTMLElement>,
) {
  const {
    modal = true,
    onOpenChange,
    open: openProp,
    defaultOpen,
    type = 'dialog',
    closeOnClickOutside = false,
    ...other
  } = props;

  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    name: 'DialogRoot',
  });

  const [titleElementId, setTitleElementId] = React.useState<string | null>(null);
  const [descriptionElementId, setDescriptionElementId] = React.useState<string | null>(null);
  const [popupElementId, setPopupElementId] = React.useState<string | null>(null);

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

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (type === 'alertdialog' && !modal) {
        console.warn(
          'Base UI: The `type="alertdialog"` prop is only valid when `modal={true}`. Alert dialogs must be modal according to WAI-ARIA.',
        );
      }
    });
  }

  const contextValue: DialogRootContextValue = React.useMemo(() => {
    return {
      modal,
      onOpenChange: handleOpenChange,
      open,
      type,
      closeOnClickOutside,
      titleElementId,
      registerTitle: setTitleElementId,
      descriptionElementId,
      registerDescription: setDescriptionElementId,
      popupElementId,
      registerPopup: setPopupElementId,
    };
  }, [
    modal,
    handleOpenChange,
    open,
    type,
    titleElementId,
    descriptionElementId,
    popupElementId,
    closeOnClickOutside,
  ]);

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
  defaultOpen: PropTypes.bool,
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
  /**
   * @ignore
   */
  type: PropTypes.oneOf(['alertdialog', 'dialog']),
} as any;

export { DialogRoot };

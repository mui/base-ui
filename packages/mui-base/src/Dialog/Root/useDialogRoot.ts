import * as React from 'react';
import type {
  UseDialogRootParameters,
  UseDialogRootReturnValue,
  DialogRootContextValue,
} from './DialogRoot.types';
import { useControlled } from '../../utils/useControlled';
import { useTransitionTrigger } from '../../useTransition';
/**
 *
 * Demos:
 *
 * - [Dialog](https://mui.com/base-ui/react-dialog/#hooks)
 *
 * API:
 *
 * - [useDialogRoot API](https://mui.com/base-ui/react-dialog/hooks-api/#use-dialog-root)
 */
export function useDialogRoot(parameters: UseDialogRootParameters): UseDialogRootReturnValue {
  const {
    open: openParam,
    defaultOpen = false,
    onOpenChange,
    type = 'dialog',
    modal = true,
    softClose = false,
  } = parameters;

  const [open, setOpen] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'DialogRoot',
  });

  const [titleElementId, setTitleElementId] = React.useState<string | null>(null);
  const [descriptionElementId, setDescriptionElementId] = React.useState<string | null>(null);
  const [popupElementId, setPopupElementId] = React.useState<string | null>(null);

  const handleOpenChange = React.useCallback(
    (shouldOpen: boolean) => {
      setOpen(shouldOpen);
      onOpenChange?.(shouldOpen);
    },
    [onOpenChange, setOpen],
  );

  const { contextValue: transitionContextValue, hasExited } = useTransitionTrigger(open);

  if (process.env.NODE_ENV !== 'production') {
    // the above condition doesn't change at runtime
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (type === 'alertdialog' && !modal) {
        console.warn(
          'Base UI: The `type="alertdialog"` prop is only valid when `modal={true}`. Alert dialogs must be modal according to WAI-ARIA.',
        );
      }
    }, [modal, type]);
  }

  const contextValue: DialogRootContextValue = React.useMemo(() => {
    return {
      modal,
      onOpenChange: handleOpenChange,
      open,
      type,
      softClose,
      titleElementId,
      setTitleElementId,
      descriptionElementId,
      setDescriptionElementId,
      popupElementId,
      setPopupElementId,
      transitionPending: !hasExited,
    };
  }, [
    modal,
    handleOpenChange,
    open,
    type,
    titleElementId,
    descriptionElementId,
    popupElementId,
    softClose,
    hasExited,
  ]);

  return {
    contextValue,
    transitionContextValue,
    open,
    transitionPending: !hasExited,
  };
}

import * as React from 'react';
import type {
  UseDialogRootParameters,
  UseDialogRootReturnValue,
  DialogRootContextValue,
} from './DialogRoot.types';
import { useControlled } from '../../utils/useControlled';

export function useDialogRoot(parameters: UseDialogRootParameters): UseDialogRootReturnValue {
  const {
    open: openParam,
    defaultOpen,
    onOpenChange,
    type = 'dialog',
    modal = true,
    closeOnClickOutside = false,
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
      setTitleElementId,
      descriptionElementId,
      setDescriptionElementId,
      popupElementId,
      setPopupElementId,
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

  return {
    open,
    contextValue,
  };
}

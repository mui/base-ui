import * as React from 'react';
import type { UseDialogRootParameters, UseDialogRootReturnValue } from './DialogRoot.types';
import { useControlled } from '../../utils/useControlled';

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
    modal = true,
    softClose = false,
    onNestedDialogOpen,
    onNestedDialogClose,
  } = parameters;

  const [open, setOpen] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'DialogRoot',
  });

  const [titleElementId, setTitleElementId] = React.useState<string | undefined>(undefined);
  const [descriptionElementId, setDescriptionElementId] = React.useState<string | undefined>(
    undefined,
  );
  const [popupElementId, setPopupElementId] = React.useState<string | undefined>(undefined);

  const handleOpenChange = React.useCallback(
    (shouldOpen: boolean) => {
      setOpen(shouldOpen);
      onOpenChange?.(shouldOpen);
    },
    [onOpenChange, setOpen],
  );

  const [ownNestedOpenDialogs, setOwnNestedOpenDialogs] = React.useState(0);

  React.useEffect(() => {
    if (onNestedDialogOpen && open) {
      onNestedDialogOpen(ownNestedOpenDialogs);
    }

    if (onNestedDialogClose && !open) {
      onNestedDialogClose();
    }

    return () => {
      if (onNestedDialogClose && open) {
        onNestedDialogClose();
      }

      if (onNestedDialogOpen && !open) {
        onNestedDialogOpen(ownNestedOpenDialogs);
      }
    };
  }, [open, onNestedDialogClose, onNestedDialogOpen, ownNestedOpenDialogs]);

  const handleNestedDialogOpen = React.useCallback((ownChildrenCount: number) => {
    setOwnNestedOpenDialogs(ownChildrenCount + 1);
  }, []);

  const handleNestedDialogClose = React.useCallback(() => {
    setOwnNestedOpenDialogs(0);
  }, []);

  return React.useMemo(() => {
    return {
      modal,
      onOpenChange: handleOpenChange,
      open,
      softClose,
      titleElementId,
      setTitleElementId,
      descriptionElementId,
      setDescriptionElementId,
      popupElementId,
      setPopupElementId,
      onNestedDialogOpen: handleNestedDialogOpen,
      onNestedDialogClose: handleNestedDialogClose,
      nestedOpenDialogCount: ownNestedOpenDialogs,
    };
  }, [
    modal,
    handleOpenChange,
    open,
    titleElementId,
    descriptionElementId,
    popupElementId,
    softClose,
    handleNestedDialogClose,
    handleNestedDialogOpen,
    ownNestedOpenDialogs,
  ]);
}

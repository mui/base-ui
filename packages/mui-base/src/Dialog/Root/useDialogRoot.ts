'use client';

import * as React from 'react';
import type { UseDialogRootParameters, UseDialogRootReturnValue } from './DialogRoot.types';
import { useControlled } from '../../utils/useControlled';

export function useDialogRoot(parameters: UseDialogRootParameters): UseDialogRootReturnValue {
  const {
    open: openParam,
    defaultOpen = false,
    onOpenChange,
    modal = true,
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
  const hasBackdrop = React.useRef(false);

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (modal && !hasBackdrop.current) {
        console.warn(
          'Base UI: The Dialog is modal but no backdrop is present. Add the backdrop component to prevent interacting with the rest of the page.',
        );
      }
    }, [modal]);
  }

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

  const setBackdropPresent = React.useCallback((present: boolean) => {
    hasBackdrop.current = present;
  }, []);

  return React.useMemo(() => {
    return {
      modal,
      onOpenChange: handleOpenChange,
      open,
      titleElementId,
      setTitleElementId,
      descriptionElementId,
      setDescriptionElementId,
      popupElementId,
      setPopupElementId,
      onNestedDialogOpen: handleNestedDialogOpen,
      onNestedDialogClose: handleNestedDialogClose,
      nestedOpenDialogCount: ownNestedOpenDialogs,
      setBackdropPresent,
    };
  }, [
    modal,
    handleOpenChange,
    open,
    titleElementId,
    descriptionElementId,
    popupElementId,
    handleNestedDialogClose,
    handleNestedDialogOpen,
    ownNestedOpenDialogs,
    setBackdropPresent,
  ]);
}

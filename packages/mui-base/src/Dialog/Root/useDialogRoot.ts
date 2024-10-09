'use client';
import * as React from 'react';
import { useControlled } from '../../utils/useControlled';
import { PointerType } from '../../utils/useEnhancedClickHandler';

export function useDialogRoot(parameters: useDialogRoot.Parameters): useDialogRoot.ReturnValue {
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
  const [openMethod, setOpenMethod] = React.useState<PointerType | null>(null);

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
    (shouldOpen: boolean, event?: Event) => {
      setOpen(shouldOpen);
      onOpenChange?.(shouldOpen, event);
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

  React.useEffect(() => {
    if (!open) {
      setOpenMethod(null);
    }
  }, [open]);

  const handleNestedDialogOpen = React.useCallback((ownChildrenCount: number) => {
    setOwnNestedOpenDialogs(ownChildrenCount + 1);
  }, []);

  const handleNestedDialogClose = React.useCallback(() => {
    setOwnNestedOpenDialogs(0);
  }, []);

  const setBackdropPresent = React.useCallback((present: boolean) => {
    hasBackdrop.current = present;
  }, []);

  const handleTriggerClick = React.useCallback(
    (_: React.MouseEvent | React.PointerEvent, pointerType: PointerType) => {
      setOpenMethod(pointerType);
    },
    [],
  );

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
      onTriggerClick: handleTriggerClick,
      openMethod,
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
    handleTriggerClick,
    openMethod,
  ]);
}

export interface CommonParameters {
  /**
   * If `true`, the dialog supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   *
   * @default true
   */
  animated?: boolean;
  /**
   * Determines whether the dialog is open.
   */
  open?: boolean;
  /**
   * Determines whether the dialog is initally open.
   * This is an uncontrolled equivalent of the `open` prop.
   */
  defaultOpen?: boolean;
  /**
   * Determines whether the dialog is modal.
   * @default true
   */
  modal?: boolean;
  /**
   * Callback invoked when the dialog is being opened or closed.
   */
  onOpenChange?: (open: boolean, event?: Event) => void;
  /**
   * Determines whether the dialog should close when clicking outside of it.
   * @default true
   */
  dismissible?: boolean;
}

export namespace useDialogRoot {
  export interface Parameters extends CommonParameters {
    /**
     * Callback to invoke when a nested dialog is opened.
     */
    onNestedDialogOpen?: (ownChildrenCount: number) => void;
    /**
     * Callback to invoke when a nested dialog is closed.
     */
    onNestedDialogClose?: () => void;
  }

  export interface ReturnValue {
    /**
     * The id of the description element associated with the dialog.
     */
    descriptionElementId: string | undefined;
    /**
     * Determines if the dialog is modal.
     */
    modal: boolean;
    /**
     * Number of nested dialogs that are currently open.
     */
    nestedOpenDialogCount: number;
    /**
     * Callback to invoke when a nested dialog is closed.
     */
    onNestedDialogClose?: () => void;
    /**
     * Callback to invoke when a nested dialog is opened.
     */
    onNestedDialogOpen?: (ownChildrenCount: number) => void;
    /**
     * Callback to fire when the dialog is requested to be opened or closed.
     */
    onOpenChange: (open: boolean, event?: Event) => void;
    /**
     * Determines if the dialog is open.
     */
    open: boolean;
    /**
     * Determines what triggered the dialog to open.
     */
    openMethod: PointerType | null;
    /**
     * Callback to fire when the trigger is activated.
     */
    onTriggerClick: (
      event: React.MouseEvent | React.PointerEvent,
      pointerType: PointerType,
    ) => void;
    /**
     * The id of the popup element.
     */
    popupElementId: string | undefined;
    /**
     * Callback to notify the dialog that the backdrop is present.
     */
    setBackdropPresent: (present: boolean) => void;
    /**
     * Callback to set the id of the description element associated with the dialog.
     */
    setDescriptionElementId: (elementId: string | undefined) => void;
    /**
     * Callback to set the id of the popup element.
     */
    setPopupElementId: (elementId: string | undefined) => void;
    /**
     * Callback to set the id of the title element.
     */
    setTitleElementId: (elementId: string | undefined) => void;
    /**
     * The id of the title element associated with the dialog.
     */
    titleElementId: string | undefined;
  }
}

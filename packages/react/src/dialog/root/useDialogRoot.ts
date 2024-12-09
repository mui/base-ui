'use client';
import * as React from 'react';
import {
  FloatingRootContext,
  useClick,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
} from '@floating-ui/react';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useTransitionStatus, type TransitionStatus } from '../../utils/useTransitionStatus';
import { type InteractionType } from '../../utils/useEnhancedClickHandler';
import type { RequiredExcept, GenericHTMLProps } from '../../utils/types';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAfterExitAnimation } from '../../utils/useAfterExitAnimation';

export function useDialogRoot(parameters: useDialogRoot.Parameters): useDialogRoot.ReturnValue {
  const {
    defaultOpen,
    dismissible,
    modal,
    onNestedDialogClose,
    onNestedDialogOpen,
    onOpenChange,
    open: openParam,
  } = parameters;

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'DialogRoot',
    state: 'open',
  });

  const popupRef = React.useRef<HTMLElement>(null);

  const [titleElementId, setTitleElementId] = React.useState<string | undefined>(undefined);
  const [descriptionElementId, setDescriptionElementId] = React.useState<string | undefined>(
    undefined,
  );
  const [triggerElement, setTriggerElement] = React.useState<Element | null>(null);
  const [popupElement, setPopupElement] = React.useState<HTMLElement | null>(null);
  const [popupElementId, setPopupElementId] = React.useState<string | undefined>(undefined);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const setOpen = useEventCallback((nextOpen: boolean, event?: Event) => {
    onOpenChange?.(nextOpen, event);
    setOpenUnwrapped(nextOpen);
  });

  useAfterExitAnimation({
    open,
    animatedElementRef: popupRef,
    onFinished: () => setMounted(false),
  });

  const context = useFloatingRootContext({
    elements: { reference: triggerElement, floating: popupElement },
    open,
    onOpenChange: setOpen,
  });
  const [ownNestedOpenDialogs, setOwnNestedOpenDialogs] = React.useState(0);
  const isTopmost = ownNestedOpenDialogs === 0;

  const click = useClick(context);
  const dismiss = useDismiss(context, {
    outsidePressEvent: 'mousedown',
    outsidePress: isTopmost && dismissible,
    escapeKey: isTopmost,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

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

  const { openMethod, triggerProps } = useOpenInteractionType(open);

  return React.useMemo(() => {
    return {
      modal,
      onOpenChange: setOpen,
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
      openMethod,
      mounted,
      transitionStatus,
      getTriggerProps: (externalProps?: React.HTMLProps<Element>) =>
        getReferenceProps(mergeReactProps(externalProps, triggerProps)),
      getPopupProps: getFloatingProps,
      setTriggerElement,
      setPopupElement,
      popupRef,
      floatingRootContext: context,
    } satisfies useDialogRoot.ReturnValue;
  }, [
    modal,
    open,
    setOpen,
    titleElementId,
    descriptionElementId,
    popupElementId,
    handleNestedDialogClose,
    handleNestedDialogOpen,
    ownNestedOpenDialogs,
    openMethod,
    mounted,
    transitionStatus,
    getReferenceProps,
    getFloatingProps,
    setTriggerElement,
    setPopupElement,
    triggerProps,
    popupRef,
    context,
  ]);
}

export interface CommonParameters {
  /**
   * Determines whether the dialog is open.
   */
  open?: boolean;
  /**
   * Determines whether the dialog is initally open.
   * This is an uncontrolled equivalent of the `open` prop.
   *
   * @default false
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
  export interface Parameters extends RequiredExcept<CommonParameters, 'open' | 'onOpenChange'> {
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
    openMethod: InteractionType | null;
    /**
     * The id of the popup element.
     */
    popupElementId: string | undefined;
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
    /**
     * Determines if the dialog should be mounted.
     */
    mounted: boolean;
    /**
     * The transition status of the dialog.
     */
    transitionStatus: TransitionStatus;
    /**
     * Resolver for the Trigger element's props.
     */
    getTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    /**
     * Resolver for the Popup element's props.
     */
    getPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    /**
     * Callback to register the Trigger element DOM node.
     */
    setTriggerElement: React.Dispatch<React.SetStateAction<Element | null>>;
    /**
     * Callback to register the Popup element DOM node.
     */
    setPopupElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
    /**
     * The ref to the Popup element.
     */
    popupRef: React.RefObject<HTMLElement | null>;
    /**
     * The Floating UI root context.
     */
    floatingRootContext: FloatingRootContext;
  }
}

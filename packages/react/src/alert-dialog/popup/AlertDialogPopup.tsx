'use client';
import * as React from 'react';
import { FloatingFocusManager } from '@floating-ui/react';
import { useDialogPopup } from '../../dialog/popup/useDialogPopup';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { useForkRef } from '../../utils/useForkRef';
import { InteractionType } from '../../utils/useEnhancedClickHandler';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { AlertDialogPopupDataAttributes } from './AlertDialogPopupDataAttributes';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { useAlertDialogPortalContext } from '../portal/AlertDialogPortalContext';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { inertValue } from '../../utils/inertValue';

const customStyleHookMapping: CustomStyleHookMapping<AlertDialogPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
  nestedDialogOpen(value) {
    return value ? { [AlertDialogPopupDataAttributes.nestedDialogOpen]: '' } : null;
  },
};

/**
 * A container for the alert dialog contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog)
 */
export const AlertDialogPopup = React.forwardRef(function AlertDialogPopup(
  componentProps: AlertDialogPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, initialFocus, finalFocus, ...elementProps } = componentProps;

  const {
    descriptionElementId,
    floatingRootContext,
    getPopupProps,
    mounted,
    nested,
    nestedOpenDialogCount,
    setOpen,
    open,
    openMethod,
    popupRef,
    setPopupElement,
    titleElementId,
    transitionStatus,
    modal,
    onOpenChangeComplete,
    internalBackdropRef,
  } = useAlertDialogRootContext();

  useAlertDialogPortalContext();

  useOpenChangeComplete({
    open,
    ref: popupRef,
    onComplete() {
      if (open) {
        onOpenChangeComplete?.(true);
      }
    },
  });

  const mergedRef = useForkRef(forwardedRef, popupRef);

  const { getRootProps, resolvedInitialFocus } = useDialogPopup({
    descriptionElementId,
    getPopupProps,
    initialFocus,
    modal: true,
    mounted,
    setOpen,
    openMethod,
    ref: mergedRef,
    setPopupElement,
    titleElementId,
  });

  const nestedDialogOpen = nestedOpenDialogCount > 0;

  const state: AlertDialogPopup.State = React.useMemo(
    () => ({
      open,
      nested,
      transitionStatus,
      nestedDialogOpen,
    }),
    [open, nested, transitionStatus, nestedDialogOpen],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    propGetter: getRootProps,
    props: {
      ...elementProps,
      style: {
        ...elementProps.style,
        '--nested-dialogs': nestedOpenDialogCount,
      } as React.CSSProperties,
      role: 'alertdialog',
    },
    customStyleHookMapping,
  });

  return (
    <React.Fragment>
      {mounted && modal && <InternalBackdrop ref={internalBackdropRef} inert={inertValue(!open)} />}
      <FloatingFocusManager
        context={floatingRootContext}
        disabled={!mounted}
        initialFocus={resolvedInitialFocus}
        returnFocus={finalFocus}
      >
        {element}
      </FloatingFocusManager>
    </React.Fragment>
  );
});

export namespace AlertDialogPopup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Determines the element to focus when the dialog is opened.
     * By default, the first focusable element is focused.
     */
    initialFocus?:
      | React.RefObject<HTMLElement | null>
      | ((interactionType: InteractionType) => React.RefObject<HTMLElement | null>);
    /**
     * Determines the element to focus when the dialog is closed.
     * By default, focus returns to the trigger.
     */
    finalFocus?: React.RefObject<HTMLElement | null>;
  }

  export interface State {
    /**
     * Whether the dialog is currently open.
     */
    open: boolean;
    transitionStatus: TransitionStatus;
    /**
     * Whether the dialog is nested within a parent dialog.
     */
    nested: boolean;
    /**
     * Whether the dialog has nested dialogs open.
     */
    nestedDialogOpen: boolean;
  }
}

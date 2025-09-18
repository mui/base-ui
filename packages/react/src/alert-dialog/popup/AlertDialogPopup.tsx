'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { inertValue } from '@base-ui-components/utils/inertValue';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { FloatingFocusManager } from '../../floating-ui-react';
import { useDialogPopup } from '../../dialog/popup/useDialogPopup';
import { useAlertDialogRootContext } from '../root/AlertDialogRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { AlertDialogPopupCssVars } from './AlertDialogPopupCssVars';
import { AlertDialogPopupDataAttributes } from './AlertDialogPopupDataAttributes';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { useAlertDialogPortalContext } from '../portal/AlertDialogPortalContext';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';

const stateAttributesMapping: StateAttributesMapping<AlertDialogPopup.State> = {
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

  const mergedRef = useMergedRefs(forwardedRef, popupRef);

  const { popupProps } = useDialogPopup({
    descriptionElementId,
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
    props: [
      getPopupProps(),
      popupProps,
      {
        style: {
          [AlertDialogPopupCssVars.nestedDialogs]: nestedOpenDialogCount,
        } as React.CSSProperties,
        role: 'alertdialog',
      },
      elementProps,
    ],
    stateAttributesMapping,
  });

  // Default initial focus logic:
  // If opened by touch, focus the popup element to prevent the virtual keyboard from opening
  // (this is required for Android specifically as iOS handles this automatically).
  const defaultInitialFocus = useEventCallback((interactionType: InteractionType) => {
    if (interactionType === 'touch') {
      return popupRef.current;
    }
    return true;
  });

  const resolvedInitialFocus = initialFocus === undefined ? defaultInitialFocus : initialFocus;

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
     *
     * - `false`: Do not move focus.
     * - `true`: Move focus based on the default behavior (first tabbable element or popup).
     * - `RefObject`: Move focus to the ref element.
     * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
     *   Return an element to focus, `true` to use the default behavior, or `false`/`undefined` to do nothing.
     */
    initialFocus?:
      | boolean
      | React.RefObject<HTMLElement | null>
      | ((openType: InteractionType) => boolean | HTMLElement | null | void);
    /**
     * Determines the element to focus when the dialog is closed.
     *
     * - `false`: Do not move focus.
     * - `true`: Move focus based on the default behavior (trigger or previously focused element).
     * - `RefObject`: Move focus to the ref element.
     * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
     *   Return an element to focus, `true` to use the default behavior, or `false`/`undefined` to do nothing.
     */
    finalFocus?:
      | boolean
      | React.RefObject<HTMLElement | null>
      | ((closeType: InteractionType) => boolean | HTMLElement | null | void);
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

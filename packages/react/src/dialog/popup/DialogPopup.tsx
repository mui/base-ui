'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { inertValue } from '@base-ui-components/utils/inertValue';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { FloatingFocusManager } from '../../floating-ui-react';
import { useDialogPopup } from './useDialogPopup';
import { useDialogRootContext } from '../root/DialogRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { type BaseUIComponentProps } from '../../utils/types';
import { type TransitionStatus } from '../../utils/useTransitionStatus';
import { type CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { DialogPopupCssVars } from './DialogPopupCssVars';
import { DialogPopupDataAttributes } from './DialogPopupDataAttributes';
import { InternalBackdrop } from '../../utils/InternalBackdrop';
import { useDialogPortalContext } from '../portal/DialogPortalContext';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';

const customStyleHookMapping: CustomStyleHookMapping<DialogPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
  nestedDialogOpen(value) {
    return value ? { [DialogPopupDataAttributes.nestedDialogOpen]: '' } : null;
  },
};

/**
 * A container for the dialog contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogPopup = React.forwardRef(function DialogPopup(
  componentProps: DialogPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, finalFocus, initialFocus, render, ...elementProps } = componentProps;

  const {
    descriptionElementId,
    dismissible,
    floatingRootContext,
    getPopupProps,
    modal,
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
    onOpenChangeComplete,
    internalBackdropRef,
  } = useDialogRootContext();

  useDialogPortalContext();

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

  // Default initial focus logic:
  // If opened by touch, focus the popup element to prevent the virtual keyboard from opening
  // (this is required for Android specifically as iOS handles this automatically).
  const defaultInitialFocus = useEventCallback((interactionType: InteractionType) => {
    if (interactionType === 'touch') {
      return popupRef.current;
    }

    return 0;
  });

  const resolvedInitialFocus = initialFocus === undefined ? defaultInitialFocus : initialFocus;

  const nestedDialogOpen = nestedOpenDialogCount > 0;

  const state: DialogPopup.State = React.useMemo(
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
          [DialogPopupCssVars.nestedDialogs]: nestedOpenDialogCount,
        } as React.CSSProperties,
      },
      elementProps,
    ],
    customStyleHookMapping,
  });

  return (
    <React.Fragment>
      {mounted && modal === true && (
        <InternalBackdrop ref={internalBackdropRef} inert={inertValue(!open)} />
      )}
      <FloatingFocusManager
        context={floatingRootContext}
        openInteractionType={openMethod}
        disabled={!mounted}
        closeOnFocusOut={dismissible}
        initialFocus={resolvedInitialFocus}
        returnFocus={finalFocus}
        modal={modal !== false}
        restoreFocus="popup"
      >
        {element}
      </FloatingFocusManager>
    </React.Fragment>
  );
});

export namespace DialogPopup {
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Determines the element to focus when the dialog is opened.
     * By default, the first focusable element is focused.
     */
    initialFocus?:
      | null
      | React.RefObject<HTMLElement | null>
      | ((openType: InteractionType) => HTMLElement | null | void);
    /**
     * Determines the element to focus when the dialog is closed.
     * By default, focus returns to the trigger.
     */
    finalFocus?:
      | null
      | React.RefObject<HTMLElement | null>
      | ((closeType: InteractionType) => HTMLElement | null | void);
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

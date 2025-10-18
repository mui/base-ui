'use client';
import * as React from 'react';
import { InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { inertValue } from '@base-ui-components/utils/inertValue';
import { FloatingFocusManager } from '../../floating-ui-react';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
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
import { COMPOSITE_KEYS } from '../../composite/composite';

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

  const { store } = useDialogRootContext();

  const descriptionElementId = store.useState('descriptionElementId');
  const floatingRootContext = store.useState('floatingRootContext');
  const rootPopupProps = store.useState('popupProps');
  const mounted = store.useState('mounted');
  const nested = store.useState('nested');
  const nestedOpenDialogCount = store.useState('nestedOpenDialogCount');
  const open = store.useState('open');
  const titleElementId = store.useState('titleElementId');
  const transitionStatus = store.useState('transitionStatus');

  useAlertDialogPortalContext();

  useOpenChangeComplete({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete?.(true);
      }
    },
  });

  // Default initial focus logic:
  // If opened by touch, focus the popup element to prevent the virtual keyboard from opening
  // (this is required for Android specifically as iOS handles this automatically).
  function defaultInitialFocus(interactionType: InteractionType) {
    if (interactionType === 'touch') {
      return store.context.popupRef.current;
    }
    return true;
  }

  const resolvedInitialFocus = initialFocus === undefined ? defaultInitialFocus : initialFocus;

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
      rootPopupProps,
      {
        'aria-labelledby': titleElementId ?? undefined,
        'aria-describedby': descriptionElementId ?? undefined,
        role: 'alertdialog',
        tabIndex: -1,
        hidden: !mounted,
        onKeyDown(event: React.KeyboardEvent) {
          if (COMPOSITE_KEYS.has(event.key)) {
            event.stopPropagation();
          }
        },
        style: {
          [AlertDialogPopupCssVars.nestedDialogs]: nestedOpenDialogCount,
        } as React.CSSProperties,
      },
      elementProps,
    ],
    ref: [forwardedRef, store.context.popupRef, store.getElementSetter('popupElement')],
    stateAttributesMapping,
  });

  return (
    <React.Fragment>
      {mounted && (
        <InternalBackdrop ref={store.context.internalBackdropRef} inert={inertValue(!open)} />
      )}
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

export interface AlertDialogPopupProps extends BaseUIComponentProps<'div', AlertDialogPopup.State> {
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

export interface AlertDialogPopupState {
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

export namespace AlertDialogPopup {
  export type Props = AlertDialogPopupProps;
  export type State = AlertDialogPopupState;
}

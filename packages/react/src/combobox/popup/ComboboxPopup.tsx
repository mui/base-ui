'use client';
import * as React from 'react';
import { InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { useStore } from '@base-ui-components/utils/store';
import { FloatingFocusManager } from '../../floating-ui-react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import {
  useComboboxFloatingContext,
  useComboboxRootContext,
  useComboboxDerivedItemsContext,
} from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { DISABLED_TRANSITIONS_STYLE, EMPTY_OBJECT } from '../../utils/constants';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { contains, getTarget } from '../../floating-ui-react/utils';

const stateAttributesMapping: StateAttributesMapping<ComboboxPopup.State> = {
  ...popupStateMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the list.
 * Renders a `<div>` element.
 */
export const ComboboxPopup = React.forwardRef(function ComboboxPopup(
  componentProps: ComboboxPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, initialFocus, finalFocus, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const positioning = useComboboxPositionerContext();
  const floatingRootContext = useComboboxFloatingContext();
  const { filteredItems } = useComboboxDerivedItemsContext();

  const mounted = useStore(store, selectors.mounted);
  const open = useStore(store, selectors.open);
  const openMethod = useStore(store, selectors.openMethod);
  const transitionStatus = useStore(store, selectors.transitionStatus);
  const inputInsidePopup = useStore(store, selectors.inputInsidePopup);
  const inputElement = useStore(store, selectors.inputElement);
  const listElement = useStore(store, selectors.listElement);

  const empty = filteredItems.length === 0;

  useOpenChangeComplete({
    open,
    ref: store.state.popupRef,
    onComplete() {
      if (open) {
        store.state.onOpenChangeComplete(true);
      }
    },
  });

  const state: ComboboxPopup.State = React.useMemo(
    () => ({
      open,
      side: positioning.side,
      align: positioning.align,
      anchorHidden: positioning.anchorHidden,
      transitionStatus,
      empty,
    }),
    [open, positioning.side, positioning.align, positioning.anchorHidden, transitionStatus, empty],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, store.state.popupRef],
    props: [
      {
        tabIndex: -1,
        onFocus(event) {
          const target = getTarget(event.nativeEvent) as Element | null;
          if (openMethod !== 'touch' && !contains(listElement, target)) {
            store.state.inputRef.current?.focus();
          }
        },
      },
      transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT,
      elementProps,
    ],
    stateAttributesMapping,
  });

  // Default initial focus logic:
  // If opened by touch, focus the popup element to prevent the virtual keyboard from opening
  // (this is required for Android specifically as iOS handles this automatically).
  const computedDefaultInitialFocus = inputInsidePopup
    ? (interactionType: InteractionType) =>
        interactionType === 'touch' ? store.state.popupRef.current : inputElement
    : false;

  const resolvedInitialFocus =
    initialFocus === undefined ? computedDefaultInitialFocus : initialFocus;

  let resolvedFinalFocus: ComboboxPopup.Props['finalFocus'] | boolean | undefined;
  if (finalFocus != null) {
    resolvedFinalFocus = finalFocus;
  } else {
    resolvedFinalFocus = inputInsidePopup ? undefined : false;
  }

  return (
    <FloatingFocusManager
      context={floatingRootContext}
      disabled={!mounted}
      modal={!inputInsidePopup}
      openInteractionType={openMethod}
      initialFocus={resolvedInitialFocus}
      returnFocus={resolvedFinalFocus}
    >
      {element}
    </FloatingFocusManager>
  );
});

export namespace ComboboxPopup {
  export interface State {
    open: boolean;
    side: Side;
    align: Align;
    anchorHidden: boolean;
    transitionStatus: TransitionStatus;
    empty: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Determines the element to focus when the popup is opened.
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
      | ((openType: InteractionType) => void | boolean | HTMLElement | null);
    /**
     * Determines the element to focus when the popup is closed.
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
      | ((closeType: InteractionType) => void | boolean | HTMLElement | null);
  }
}

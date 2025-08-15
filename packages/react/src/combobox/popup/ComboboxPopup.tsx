'use client';
import * as React from 'react';
import { InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { useStore } from '@base-ui-components/utils/store';
import { useLatestRef } from '@base-ui-components/utils/useLatestRef';
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
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

const customStyleHookMapping: CustomStyleHookMapping<ComboboxPopup.State> = {
  ...popupStateMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the items.
 * Renders a `<div>` element.
 */
export const ComboboxPopup = React.forwardRef(function ComboboxPopup(
  componentProps: ComboboxPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, initialFocus, finalFocus, ...elementProps } = componentProps;

  const { store, popupRef, inputRef, onOpenChangeComplete } = useComboboxRootContext();
  const positioning = useComboboxPositionerContext();
  const floatingRootContext = useComboboxFloatingContext();
  const { filteredItems } = useComboboxDerivedItemsContext();

  const open = useStore(store, selectors.open);
  const openMethod = useStore(store, selectors.openMethod);
  const transitionStatus = useStore(store, selectors.transitionStatus);
  const anchorElement = useStore(store, selectors.anchorElement);
  const inputElement = useStore(store, selectors.inputElement);
  const triggerElement = useStore(store, selectors.triggerElement);

  const isAnchorInput = anchorElement === inputElement;
  const empty = filteredItems.length === 0;

  useOpenChangeComplete({
    open,
    ref: popupRef,
    onComplete() {
      if (open) {
        onOpenChangeComplete?.(true);
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
    ref: [forwardedRef, popupRef],
    props: [
      {
        tabIndex: -1,
      },
      transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT,
      elementProps,
    ],
    customStyleHookMapping,
  });

  const triggerRef = useLatestRef(triggerElement);

  const resolvedInitialFocus = React.useMemo(() => {
    if (initialFocus == null) {
      if (openMethod === 'touch') {
        return popupRef;
      }
      return isAnchorInput ? -1 : inputRef;
    }

    if (typeof initialFocus === 'function') {
      return initialFocus(openMethod ?? '');
    }

    return initialFocus;
  }, [initialFocus, openMethod, isAnchorInput, inputRef, popupRef]);

  const resolvedFinalFocus = React.useMemo(() => {
    if (finalFocus != null) {
      return finalFocus;
    }
    return isAnchorInput ? false : triggerRef;
  }, [finalFocus, isAnchorInput, triggerRef]);

  return (
    <FloatingFocusManager
      context={floatingRootContext}
      modal={isAnchorInput}
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
     * By default, the first focusable element is focused.
     */
    initialFocus?:
      | React.RefObject<HTMLElement | null>
      | ((interactionType: InteractionType) => React.RefObject<HTMLElement | null>);
    /**
     * Determines the element to focus when the popup is closed.
     * By default, focus returns to the trigger.
     */
    finalFocus?: React.RefObject<HTMLElement | null>;
  }
}

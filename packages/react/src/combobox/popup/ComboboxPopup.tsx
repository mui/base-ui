'use client';
import * as React from 'react';
import { InteractionType } from '@base-ui/utils/useEnhancedClickHandler';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FloatingFocusManager } from '../../floating-ui-react';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useComboboxFloatingContext, useComboboxRootContext } from '../root/ComboboxRootContext';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';
import type { Side, Align } from '../../internals/useAnchorPositioning';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { transitionStatusMapping } from '../../internals/stateAttributesMapping';
import { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { contains, getTarget } from '../../floating-ui-react/utils';
import { getDisabledMountTransitionStyles } from '../../internals/getDisabledMountTransitionStyles';
import { ComboboxInternalDismissButton } from '../utils/ComboboxInternalDismissButton';
import { getComboboxPopupId } from '../root/utils';
import { useListEmpty } from '../utils/parts';

const stateAttributesMapping: StateAttributesMapping<ComboboxPopupState> = {
  ...popupStateMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the list.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxPopup = React.forwardRef(function ComboboxPopup(
  componentProps: ComboboxPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, initialFocus, finalFocus, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const positioning = useComboboxPositionerContext();
  const floatingRootContext = useComboboxFloatingContext();

  const mounted = store.useState('mounted');
  const open = store.useState('open');
  const openMethod = store.useState('openMethod');
  const popupProps = store.useState('popupProps');
  const transitionStatus = store.useState('transitionStatus');
  const inputInsidePopup = store.useState('inputInsidePopup');
  const inputElement = store.useState('inputElement');
  const modal = store.useState('modal');
  const rootId = store.useState('id');

  const empty = useListEmpty();
  const popupId = elementProps.id ?? (inputInsidePopup ? getComboboxPopupId(rootId) : undefined);

  useIsoLayoutEffect(() => {
    // Prefer the rendered DOM id, which a `render` prop element or function may override.
    store.set('popupId', store.context.popupRef.current?.id || popupId);
    return () => {
      store.set('popupId', undefined);
    };
  }, [store, popupId]);

  useOpenChangeComplete({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete(true);
      }
    },
  });

  const state: ComboboxPopupState = {
    open,
    side: positioning.side,
    align: positioning.align,
    anchorHidden: positioning.anchorHidden,
    transitionStatus,
    empty,
  };

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, store.context.popupRef],
    props: [
      popupProps,
      {
        id: popupId,
        role: inputInsidePopup ? 'dialog' : 'presentation',
        onFocus(event) {
          const target = getTarget(event.nativeEvent) as Element | null;
          if (
            openMethod !== 'touch' &&
            (contains(store.state.listElement, target) || target === event.currentTarget)
          ) {
            store.context.inputRef.current?.focus();
          }
        },
      },
      getDisabledMountTransitionStyles(transitionStatus),
      elementProps,
    ],
    stateAttributesMapping,
  });

  // Default initial focus logic:
  // If opened by touch, focus the popup element to prevent the virtual keyboard from opening
  // (this is required for Android specifically as iOS handles this automatically).
  const computedDefaultInitialFocus = inputInsidePopup
    ? (interactionType: InteractionType) =>
        interactionType === 'touch' ? store.context.popupRef.current : inputElement
    : false;

  const resolvedInitialFocus =
    initialFocus === undefined ? computedDefaultInitialFocus : initialFocus;

  let resolvedFinalFocus: ComboboxPopup.Props['finalFocus'] | boolean | undefined;
  if (finalFocus != null) {
    resolvedFinalFocus = finalFocus;
  } else {
    resolvedFinalFocus = inputInsidePopup ? undefined : false;
  }

  const focusManagerModal = !inputInsidePopup || modal;

  return (
    <FloatingFocusManager
      context={floatingRootContext}
      disabled={!mounted}
      modal={focusManagerModal}
      openInteractionType={openMethod}
      initialFocus={resolvedInitialFocus}
      returnFocus={resolvedFinalFocus}
      getInsideElements={() => [
        store.context.startDismissRef.current,
        store.context.endDismissRef.current,
      ]}
    >
      <React.Fragment>
        {element}
        {focusManagerModal && <ComboboxInternalDismissButton ref={store.context.endDismissRef} />}
      </React.Fragment>
    </FloatingFocusManager>
  );
});

export interface ComboboxPopupState {
  /**
   * Whether the component is open.
   */
  open: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side;
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the anchor element is hidden.
   */
  anchorHidden: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
  /**
   * Whether there are no items to display.
   */
  empty: boolean;
}

export interface ComboboxPopupProps extends BaseUIComponentProps<'div', ComboboxPopupState> {
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
    | ((openType: InteractionType) => void | boolean | HTMLElement | null)
    | undefined;
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
    | ((closeType: InteractionType) => void | boolean | HTMLElement | null)
    | undefined;
}

export namespace ComboboxPopup {
  export type State = ComboboxPopupState;
  export type Props = ComboboxPopupProps;
}

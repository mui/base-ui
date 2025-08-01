'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useLatestRef } from '@base-ui-components/utils/useLatestRef';
import { FloatingFocusManager } from '../../floating-ui-react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxFloatingContext, useComboboxRootContext } from '../root/ComboboxRootContext';
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
 * A container for the combobox items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxPopup = React.forwardRef(function ComboboxPopup(
  componentProps: ComboboxPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { store, popupRef, inputRef, onOpenChangeComplete } = useComboboxRootContext();
  const positioning = useComboboxPositionerContext();
  const floatingRootContext = useComboboxFloatingContext();

  const open = useStore(store, selectors.open);
  const transitionStatus = useStore(store, selectors.transitionStatus);
  const anchorElement = useStore(store, selectors.anchorElement);
  const inputElement = useStore(store, selectors.inputElement);
  const triggerElement = useStore(store, selectors.triggerElement);

  const didPointerDown = React.useRef(false);

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
    }),
    [open, positioning.side, positioning.align, positioning.anchorHidden, transitionStatus],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, popupRef],
    props: [
      {
        tabIndex: -1,
        onPointerDown({ pointerType }) {
          if (pointerType === 'touch') {
            return;
          }

          didPointerDown.current = true;
          inputRef.current?.focus();
          setTimeout(() => {
            didPointerDown.current = false;
          });
        },
        onFocus() {
          if (didPointerDown.current) {
            inputRef.current?.focus();
            didPointerDown.current = false;
          }
        },
      },
      transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT,
      elementProps,
    ],
    customStyleHookMapping,
  });

  const isAnchorInput = anchorElement === inputElement;
  const triggerRef = useLatestRef(triggerElement);

  return (
    <FloatingFocusManager
      context={floatingRootContext}
      modal={false}
      initialFocus={isAnchorInput ? -1 : inputRef}
      returnFocus={isAnchorInput ? false : triggerRef}
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
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

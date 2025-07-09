'use client';
import * as React from 'react';
import { FloatingFocusManager } from '../../floating-ui-react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxFloatingContext, useComboboxRootContext } from '../root/ComboboxRootContext';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';
import type { Side, Align } from '../../utils/useAnchorPositioning';

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

  const { store, popupRef, inputRef } = useComboboxRootContext();
  const positioning = useComboboxPositionerContext();
  const floatingRootContext = useComboboxFloatingContext();
  const open = useSelector(store, selectors.open);

  const state: ComboboxPopup.State = React.useMemo(
    () => ({
      open,
      side: positioning.side,
      align: positioning.align,
      anchorHidden: positioning.anchorHidden,
    }),
    [open, positioning.side, positioning.align, positioning.anchorHidden],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, popupRef],
    props: [
      {
        tabIndex: -1,
        onFocus() {
          inputRef.current?.focus();
        },
      },
      elementProps,
    ],
    customStyleHookMapping: popupStateMapping,
  });

  return (
    <FloatingFocusManager context={floatingRootContext} initialFocus={-1} returnFocus={false}>
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
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    id?: string;
  }
}

'use client';
import * as React from 'react';
import { useMenuRadioItemContext } from '../radio-item/MenuRadioItemContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { itemMapping } from '../utils/styleHookMapping';
import { TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';

/**
 * Indicates whether the radio item is selected.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuRadioItemIndicator = React.forwardRef(function MenuRadioItemIndicator(
  componentProps: MenuRadioItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = false, ...elementProps } = componentProps;

  const item = useMenuRadioItemContext();

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);

  const { transitionStatus, setMounted } = useTransitionStatus(item.checked);

  useOpenChangeComplete({
    open: item.checked,
    ref: indicatorRef,
    onComplete() {
      if (!item.checked) {
        setMounted(false);
      }
    },
  });

  const state: MenuRadioItemIndicator.State = React.useMemo(
    () => ({
      checked: item.checked,
      disabled: item.disabled,
      highlighted: item.highlighted,
      transitionStatus,
    }),
    [item.checked, item.disabled, item.highlighted, transitionStatus],
  );

  const element = useRenderElement('span', componentProps, {
    state,
    customStyleHookMapping: itemMapping,
    ref: [forwardedRef, indicatorRef],
    props: {
      'aria-hidden': true,
      ...elementProps,
    },
    enabled: keepMounted || item.checked,
  });

  return element;
});

export namespace MenuRadioItemIndicator {
  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Whether to keep the HTML element in the DOM when the radio item is inactive.
     * @default false
     */
    keepMounted?: boolean;
  }

  export interface State {
    /**
     * Whether the radio item is currently selected.
     */
    checked: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    highlighted: boolean;
    transitionStatus: TransitionStatus;
  }
}

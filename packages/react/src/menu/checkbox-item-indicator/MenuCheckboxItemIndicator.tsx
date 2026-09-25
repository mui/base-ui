'use client';
import * as React from 'react';
import { useMenuCheckboxItemContext } from '../checkbox-item/MenuCheckboxItemContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { BaseUIComponentProps } from '../../internals/types';
import { getCheckboxItemStateAttributesMapping } from '../checkbox-item/getCheckboxItemStateAttributesMapping';
import { TransitionStatus, useTransitionStatus } from '../../internals/useTransitionStatus';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';

/**
 * Indicates whether the checkbox item is ticked or in a mixed state.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuCheckboxItemIndicator = React.forwardRef(function MenuCheckboxItemIndicator(
  componentProps: MenuCheckboxItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, style, keepMounted = false, ...elementProps } = componentProps;

  const item = useMenuCheckboxItemContext();

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);

  const rendered = item.checked || item.indeterminate;

  const { transitionStatus, mounted, setMounted } = useTransitionStatus(rendered);

  useOpenChangeComplete({
    batch: true,
    enabled: !rendered,
    open: rendered,
    ref: indicatorRef,
    onComplete() {
      if (!rendered) {
        setMounted(false);
      }
    },
  });

  const state: MenuCheckboxItemIndicatorState = {
    checked: item.checked,
    indeterminate: item.indeterminate,
    disabled: item.disabled,
    highlighted: item.highlighted,
    transitionStatus,
  };

  const element = useRenderElement('span', componentProps, {
    state,
    ref: [forwardedRef, indicatorRef],
    stateAttributesMapping: getCheckboxItemStateAttributesMapping(item),
    props: {
      'aria-hidden': true,
      ...elementProps,
    },
    enabled: keepMounted || mounted,
  });

  return element;
});

export interface MenuCheckboxItemIndicatorProps extends BaseUIComponentProps<
  'span',
  MenuCheckboxItemIndicatorState
> {
  /**
   * Whether to keep the HTML element in the DOM when the checkbox item is neither checked nor
   * in a mixed state.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export interface MenuCheckboxItemIndicatorState {
  /**
   * Whether the checkbox item is currently ticked.
   */
  checked: boolean;
  /**
   * Whether the checkbox item is in a mixed state.
   */
  indeterminate: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export namespace MenuCheckboxItemIndicator {
  export type Props = MenuCheckboxItemIndicatorProps;
  export type State = MenuCheckboxItemIndicatorState;
}

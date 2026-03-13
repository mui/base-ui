'use client';
import * as React from 'react';
import { useTreeCheckboxItemContext } from '../checkbox-item/TreeCheckboxItemContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { TreeCheckboxItemIndicatorDataAttributes } from './TreeCheckboxItemIndicatorDataAttributes';

const CHECKED_HOOK = { [TreeCheckboxItemIndicatorDataAttributes.checked]: '' };
const UNCHECKED_HOOK = { [TreeCheckboxItemIndicatorDataAttributes.unchecked]: '' };
const INDETERMINATE_HOOK = { [TreeCheckboxItemIndicatorDataAttributes.indeterminate]: '' };
const DISABLED_HOOK = { [TreeCheckboxItemIndicatorDataAttributes.disabled]: '' };

const stateAttributesMapping: StateAttributesMapping<TreeCheckboxItemIndicator.State> = {
  checked: (v) => (v ? CHECKED_HOOK : null),
  unchecked: (v) => (v ? UNCHECKED_HOOK : null),
  indeterminate: (v) => (v ? INDETERMINATE_HOOK : null),
  disabled: (v) => (v ? DISABLED_HOOK : null),
};

/**
 * Indicates whether the checkbox item is checked.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeCheckboxItemIndicator = React.forwardRef(function TreeCheckboxItemIndicator(
  componentProps: TreeCheckboxItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = false, ...elementProps } = componentProps;

  const item = useTreeCheckboxItemContext();

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);

  const open = item.checked || item.indeterminate;

  const { transitionStatus, setMounted } = useTransitionStatus(open);

  useOpenChangeComplete({
    open,
    ref: indicatorRef,
    onComplete() {
      if (!open) {
        setMounted(false);
      }
    },
  });

  const state: TreeCheckboxItemIndicator.State = {
    checked: item.checked,
    unchecked: !item.checked && !item.indeterminate,
    indeterminate: item.indeterminate,
    disabled: item.disabled,
    transitionStatus,
  };

  const element = useRenderElement('span', componentProps, {
    state,
    ref: [forwardedRef, indicatorRef],
    stateAttributesMapping,
    props: {
      'aria-hidden': true,
      ...elementProps,
    },
    enabled: keepMounted || open,
  });

  return element;
});

export interface TreeCheckboxItemIndicatorProps extends BaseUIComponentProps<
  'span',
  TreeCheckboxItemIndicator.State
> {
  /**
   * Whether to keep the HTML element in the DOM when the checkbox item is not checked.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export interface TreeCheckboxItemIndicatorState {
  /**
   * Whether the checkbox item is currently checked.
   */
  checked: boolean;
  /**
   * Whether the checkbox item is currently unchecked.
   */
  unchecked: boolean;
  /**
   * Whether the checkbox item is in an indeterminate state.
   */
  indeterminate: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  transitionStatus: TransitionStatus;
}

export namespace TreeCheckboxItemIndicator {
  export type Props = TreeCheckboxItemIndicatorProps;
  export type State = TreeCheckboxItemIndicatorState;
}

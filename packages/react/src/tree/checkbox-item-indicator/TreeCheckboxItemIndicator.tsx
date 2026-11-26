'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { useRenderElement } from '../../internals/useRenderElement';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { transitionStatusMapping } from '../../internals/stateAttributesMapping';
import { useTreeCheckboxItemContext } from '../checkbox-item/TreeCheckboxItemContext';
import { checkedMapping, mixedMapping } from '../utils/stateAttributesMapping';

const stateAttributesMapping: StateAttributesMapping<TreeCheckboxItemIndicatorState> = {
  ...transitionStatusMapping,
  ...checkedMapping,
};

const mixedStateAttributesMapping: StateAttributesMapping<TreeCheckboxItemIndicatorState> = {
  ...transitionStatusMapping,
  ...mixedMapping,
};

/**
 * Renders when the checkbox item is checked or mixed.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeCheckboxItemIndicator = React.forwardRef(function TreeCheckboxItemIndicator(
  componentProps: TreeCheckboxItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, style, keepMounted = false, ...elementProps } = componentProps;

  const item = useTreeCheckboxItemContext();
  const visible = item.checked || item.indeterminate;

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);
  const { transitionStatus, mounted, setMounted } = useTransitionStatus(visible);

  useOpenChangeComplete({
    batch: true,
    enabled: !visible,
    open: visible,
    ref: indicatorRef,
    onComplete() {
      if (!visible) {
        setMounted(false);
      }
    },
  });

  const state: TreeCheckboxItemIndicatorState = {
    checked: item.checked,
    indeterminate: item.indeterminate,
    disabled: item.disabled,
    transitionStatus,
  };

  return useRenderElement('span', componentProps, {
    state,
    ref: [forwardedRef, indicatorRef],
    props: [{ 'aria-hidden': true }, elementProps],
    stateAttributesMapping: item.indeterminate
      ? mixedStateAttributesMapping
      : stateAttributesMapping,
    enabled: keepMounted || mounted,
  });
});

export interface TreeCheckboxItemIndicatorState {
  /**
   * Whether the item is checked.
   */
  checked: boolean;
  /**
   * Whether the item is not checked but some of its selectable descendants are.
   */
  indeterminate: boolean;
  /**
   * Whether the item is disabled.
   */
  disabled: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface TreeCheckboxItemIndicatorProps extends BaseUIComponentProps<
  'span',
  TreeCheckboxItemIndicatorState
> {
  /**
   * Whether to keep the element in the DOM when the item is not checked.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace TreeCheckboxItemIndicator {
  export type State = TreeCheckboxItemIndicatorState;
  export type Props = TreeCheckboxItemIndicatorProps;
}

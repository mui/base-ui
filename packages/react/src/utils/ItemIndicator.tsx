'use client';
import * as React from 'react';
import type { StateAttributesMapping } from '../internals/getStateAttributesProps';
import type { BaseUIComponentProps, HTMLProps } from '../internals/types';
import { useTransitionStatus } from '../internals/useTransitionStatus';
import type { TransitionStatus } from '../internals/useTransitionStatus';
import { useOpenChangeComplete } from '../internals/useOpenChangeComplete';
import { useRenderElement } from '../internals/useRenderElement';
import { transitionStatusMapping } from '../internals/stateAttributesMapping';

export const ARIA_HIDDEN_PROPS: HTMLProps = { 'aria-hidden': true };
const ITEM_INDICATOR_PROPS: HTMLProps = { 'aria-hidden': true, children: '✔️' };

export function useSelectionIndicator<State extends Record<string, any>>(
  componentProps: BaseUIComponentProps<'span', State> & {
    keepMounted?: boolean | undefined;
    selected?: boolean | undefined;
  },
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
  rendered: boolean,
  baseState: Omit<State, 'transitionStatus'>,
  stateAttributesMapping: StateAttributesMapping<State>,
  defaultProps?: HTMLProps,
) {
  const {
    render,
    className,
    style,
    keepMounted = false,
    selected,
    ...elementProps
  } = componentProps;

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(rendered);

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

  return useRenderElement('span', componentProps, {
    ref: [forwardedRef, indicatorRef],
    state: {
      ...baseState,
      transitionStatus,
    } as unknown as State,
    stateAttributesMapping,
    props: defaultProps ? [defaultProps, elementProps] : elementProps,
    enabled: keepMounted || mounted,
  });
}

// The public wrappers mount this component only when selected or kept mounted, avoiding the
// hook costs for unselected items. Pass selection as a prop so memoization observes changes.
export const ItemIndicator = React.memo(
  React.forwardRef(function ItemIndicator(
    componentProps: ItemIndicatorProps,
    forwardedRef: React.ForwardedRef<HTMLSpanElement>,
  ) {
    const { selected } = componentProps;
    return useSelectionIndicator<ItemIndicatorState>(
      componentProps,
      forwardedRef,
      selected,
      { selected },
      transitionStatusMapping,
      ITEM_INDICATOR_PROPS,
    );
  }),
);

interface ItemIndicatorState {
  selected: boolean;
  transitionStatus: TransitionStatus;
}

interface ItemIndicatorProps extends BaseUIComponentProps<'span', ItemIndicatorState> {
  keepMounted?: boolean | undefined;
  selected: boolean;
}

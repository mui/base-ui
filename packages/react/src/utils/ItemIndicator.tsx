'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../internals/types';
import { useTransitionStatus } from '../internals/useTransitionStatus';
import type { TransitionStatus } from '../internals/useTransitionStatus';
import { useOpenChangeComplete } from '../internals/useOpenChangeComplete';
import { useRenderElement } from '../internals/useRenderElement';
import { transitionStatusMapping } from '../internals/stateAttributesMapping';

// The public wrappers mount this component only when selected or kept mounted, avoiding the
// hook costs for unselected items. Pass selection as a prop so memoization observes changes.
export const ItemIndicator = React.memo(
  React.forwardRef(function ItemIndicator(
    componentProps: ItemIndicatorProps,
    forwardedRef: React.ForwardedRef<HTMLSpanElement>,
  ) {
    const { render, className, style, keepMounted, selected, ...elementProps } = componentProps;

    const indicatorRef = React.useRef<HTMLSpanElement | null>(null);

    const { transitionStatus, setMounted } = useTransitionStatus(selected);

    const state: ItemIndicatorState = {
      selected,
      transitionStatus,
    };

    const element = useRenderElement('span', componentProps, {
      ref: [forwardedRef, indicatorRef],
      state,
      props: [
        {
          'aria-hidden': true,
          children: '✔️',
        },
        elementProps,
      ],
      stateAttributesMapping: transitionStatusMapping,
    });

    useOpenChangeComplete({
      batch: true,
      enabled: !selected,
      open: selected,
      ref: indicatorRef,
      onComplete() {
        if (!selected) {
          setMounted(false);
        }
      },
    });

    return element;
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

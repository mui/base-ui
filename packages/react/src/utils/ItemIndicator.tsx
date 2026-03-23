'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from './types';
import { type TransitionStatus, useTransitionStatus } from './useTransitionStatus';
import { useOpenChangeComplete } from './useOpenChangeComplete';
import { useRenderElement } from './useRenderElement';
import { transitionStatusMapping } from './stateAttributesMapping';

/**
 * A shared implementation for item indicators that show whether an item is selected.
 * Used by both Listbox.ItemIndicator and Select.ItemIndicator.
 *
 * The outer component bails early when `!keepMounted && !selected` to avoid
 * paying hook costs. The `Inner` component handles transition animations.
 */
export function createItemIndicator(useItemSelected: () => boolean) {
  const Inner = React.memo(
    React.forwardRef(
      (componentProps: ItemIndicatorProps, forwardedRef: React.ForwardedRef<HTMLSpanElement>) => {
        const { render, className, keepMounted, ...elementProps } = componentProps;

        const selected = useItemSelected();

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
          open: selected,
          ref: indicatorRef,
          onComplete() {
            if (!selected) {
              setMounted(false);
            }
          },
        });

        return element;
      },
    ),
  );

  return React.forwardRef(function ItemIndicator(
    componentProps: ItemIndicatorProps,
    forwardedRef: React.ForwardedRef<HTMLSpanElement>,
  ) {
    const keepMounted = componentProps.keepMounted ?? false;

    const selected = useItemSelected();

    const shouldRender = keepMounted || selected;
    if (!shouldRender) {
      return null;
    }

    return <Inner {...componentProps} ref={forwardedRef} />;
  });
}

export interface ItemIndicatorState {
  /**
   * Whether the item is selected.
   */
  selected: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface ItemIndicatorProps extends BaseUIComponentProps<'span', ItemIndicatorState> {
  children?: React.ReactNode;
  /**
   * Whether to keep the HTML element in the DOM when the item is not selected.
   */
  keepMounted?: boolean | undefined;
}

'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { type TransitionStatus, useTransitionStatus } from '../../internals/useTransitionStatus';
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete';
import { useRenderElement } from '../../internals/useRenderElement';
import { transitionStatusMapping } from '../../internals/stateAttributesMapping';
import { useListboxItemContext } from '../item/ListboxItemContext';

const Inner = React.memo(
  React.forwardRef(
    (
      componentProps: ListboxItemIndicator.Props,
      forwardedRef: React.ForwardedRef<HTMLSpanElement>,
    ) => {
      const { render, className, style, keepMounted, ...elementProps } = componentProps;

      const { selected } = useListboxItemContext();

      const indicatorRef = React.useRef<HTMLSpanElement | null>(null);

      const { transitionStatus, setMounted } = useTransitionStatus(selected);

      const state: ListboxItemIndicatorState = {
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

/**
 * Indicates whether the listbox item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export const ListboxItemIndicator = React.forwardRef(function ListboxItemIndicator(
  componentProps: ListboxItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const keepMounted = componentProps.keepMounted ?? false;

  const { selected } = useListboxItemContext();

  const shouldRender = keepMounted || selected;
  if (!shouldRender) {
    return null;
  }

  return <Inner {...componentProps} ref={forwardedRef} />;
});

export interface ListboxItemIndicatorState {
  /**
   * Whether the item is selected.
   */
  selected: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface ListboxItemIndicatorProps extends BaseUIComponentProps<
  'span',
  ListboxItemIndicatorState
> {
  children?: React.ReactNode;
  /**
   * Whether to keep the HTML element in the DOM when the item is not selected.
   */
  keepMounted?: boolean | undefined;
}

export namespace ListboxItemIndicator {
  export type State = ListboxItemIndicatorState;
  export type Props = ListboxItemIndicatorProps;
}

'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useListboxItemContext } from '../item/ListboxItemContext';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';

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

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return <Inner {...componentProps} ref={forwardedRef} />;
});

const Inner = React.memo(
  React.forwardRef(
    (
      componentProps: ListboxItemIndicator.Props,
      forwardedRef: React.ForwardedRef<HTMLSpanElement>,
    ) => {
      const { render, className, keepMounted, ...elementProps } = componentProps;

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

export interface ListboxItemIndicatorProps
  extends BaseUIComponentProps<'span', ListboxItemIndicatorState> {
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

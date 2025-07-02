'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComboboxItemContext } from '../item/ComboboxItemContext';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import { transitionStatusMapping } from '../../utils/styleHookMapping';

/**
 * Indicates whether the combobox item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxItemIndicator = React.forwardRef(function ComboboxItemIndicator(
  componentProps: ComboboxItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const keepMounted = componentProps.keepMounted ?? false;

  const { selected } = useComboboxItemContext();

  const shouldRender = keepMounted || selected;
  if (!shouldRender) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return <Inner {...componentProps} ref={forwardedRef} />;
});

/** The core implementation of the indicator is split here to avoid paying the hooks
 * costs unless the element needs to be mounted. */
const Inner = React.memo(
  React.forwardRef(
    (
      componentProps: ComboboxItemIndicator.Props,
      forwardedRef: React.ForwardedRef<HTMLSpanElement>,
    ) => {
      const { render, className, keepMounted, ...elementProps } = componentProps;

      const { selected } = useComboboxItemContext();

      const indicatorRef = React.useRef<HTMLSpanElement | null>(null);

      const { mounted, transitionStatus, setMounted } = useTransitionStatus(selected);

      const state: ComboboxItemIndicator.State = React.useMemo(
        () => ({
          selected,
          transitionStatus,
        }),
        [selected, transitionStatus],
      );

      const element = useRenderElement('span', componentProps, {
        ref: [forwardedRef, indicatorRef],
        state,
        props: [
          {
            hidden: !mounted,
            'aria-hidden': true,
            children: '✔️',
          },
          elementProps,
        ],
        customStyleHookMapping: transitionStatusMapping,
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

export namespace ComboboxItemIndicator {
  export interface Props extends BaseUIComponentProps<'span', State> {
    children?: React.ReactNode;
    /**
     * Whether to keep the HTML element in the DOM when the item is not selected.
     * @default false
     */
    keepMounted?: boolean;
  }

  export interface State {
    selected: boolean;
    transitionStatus: TransitionStatus;
  }
}

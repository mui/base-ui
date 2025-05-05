'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectItemContext } from '../item/SelectItemContext';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Indicates whether the select item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectItemIndicator = React.forwardRef(function SelectItemIndicator(
  componentProps: SelectItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = false, ...elementProps } = componentProps;

  const { selected } = useSelectItemContext();

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(selected);

  const state: SelectItemIndicator.State = React.useMemo(
    () => ({
      selected,
      transitionStatus,
    }),
    [selected, transitionStatus],
  );

  const renderElement = useRenderElement('span', componentProps, {
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

  const shouldRender = keepMounted || selected;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

export namespace SelectItemIndicator {
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

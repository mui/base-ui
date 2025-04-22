'use client';
import * as React from 'react';
import { useMenuCheckboxItemContext } from '../checkbox-item/MenuCheckboxItemContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { itemMapping } from '../utils/styleHookMapping';
import { TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useForkRef } from '../../utils/useForkRef';

/**
 * Indicates whether the checkbox item is ticked.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuCheckboxItemIndicator = React.forwardRef(function MenuCheckboxItemIndicator(
  props: MenuCheckboxItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = false, ...other } = props;

  const item = useMenuCheckboxItemContext();

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);
  const mergedRef = useForkRef(forwardedRef, indicatorRef);

  const { transitionStatus, setMounted } = useTransitionStatus(item.checked);

  useOpenChangeComplete({
    open: item.checked,
    ref: indicatorRef,
    onComplete() {
      if (!item.checked) {
        setMounted(false);
      }
    },
  });

  const state: MenuCheckboxItemIndicator.State = React.useMemo(
    () => ({
      checked: item.checked,
      disabled: item.disabled,
      highlighted: item.highlighted,
      transitionStatus,
    }),
    [item.checked, item.disabled, item.highlighted, transitionStatus],
  );

  const { renderElement } = useComponentRenderer({
    render: render || 'span',
    className,
    state,
    customStyleHookMapping: itemMapping,
    extraProps: {
      'aria-hidden': true,
      ...other,
    },
    ref: mergedRef,
  });

  const shouldRender = keepMounted || item.checked;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace MenuCheckboxItemIndicator {
  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Whether to keep the HTML element in the DOM when the checkbox item is not checked.
     * @default false
     */
    keepMounted?: boolean;
  }

  export interface State {
    /**
     * Whether the checkbox item is currently ticked.
     */
    checked: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    highlighted: boolean;
    transitionStatus: TransitionStatus;
  }
}

export { MenuCheckboxItemIndicator };

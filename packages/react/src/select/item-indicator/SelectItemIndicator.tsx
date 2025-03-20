'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useRenderElement';
import { useSelectItemContext } from '../item/SelectItemContext';
import { mergeProps } from '../../merge-props';
import { useForkRef } from '../../utils/useForkRef';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';

/**
 * Indicates whether the select item is selected.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectItemIndicator = React.forwardRef(function SelectItemIndicator(
  props: SelectItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = false, ...otherProps } = props;

  const { selected } = useSelectItemContext();

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);
  const mergedRef = useForkRef(forwardedRef, indicatorRef);

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(selected);

  const getItemProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps(
        {
          'aria-hidden': true,
          children: '✔️',
        },
        externalProps,
      ),
    [],
  );

  const state: SelectItemIndicator.State = React.useMemo(
    () => ({
      selected,
      transitionStatus,
    }),
    [selected, transitionStatus],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getItemProps,
    render: render ?? 'span',
    ref: mergedRef,
    className,
    state,
    extraProps: {
      hidden: !mounted,
      ...otherProps,
    },
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

namespace SelectItemIndicator {
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

SelectItemIndicator.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Whether to keep the HTML element in the DOM when the item is not selected.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectItemIndicator };

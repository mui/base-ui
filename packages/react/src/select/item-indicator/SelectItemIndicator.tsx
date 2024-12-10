'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useSelectItemContext } from '../item/SelectItemContext';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useForkRef } from '../../utils/useForkRef';
import { type TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useAfterExitAnimation } from '../../utils/useAfterExitAnimation';

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.com/components/react-select/)
 *
 * API:
 *
 * - [SelectItemIndicator API](https://base-ui.com/components/react-select/#api-reference-SelectItemIndicator)
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
      mergeReactProps(externalProps, {
        'aria-hidden': true,
        children: '✔️',
      }),
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

  useAfterExitAnimation({
    open: selected,
    animatedElementRef: indicatorRef,
    onFinished() {
      setMounted(false);
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
     * If `true`, the item indicator remains mounted when the item is not
     * selected.
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
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * If `true`, the item indicator remains mounted when the item is not
   * selected.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectItemIndicator };

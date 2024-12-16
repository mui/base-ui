'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useMenuRadioItemContext } from '../radio-item/MenuRadioItemContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { itemMapping } from '../utils/styleHookMapping';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { useAfterExitAnimation } from '../../utils/useAfterExitAnimation';
import { useForkRef } from '../../utils/useForkRef';

/**
 * Indicates whether the radio item is selected.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuRadioItemIndicator = React.forwardRef(function MenuRadioItemIndicator(
  props: MenuRadioItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = false, ...other } = props;

  const item = useMenuRadioItemContext();

  const indicatorRef = React.useRef<HTMLSpanElement | null>(null);
  const mergedRef = useForkRef(forwardedRef, indicatorRef);

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(item.checked);

  const getItemProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        'aria-hidden': true,
        hidden: !mounted,
      }),
    [mounted],
  );

  useAfterExitAnimation({
    open: item.checked,
    animatedElementRef: indicatorRef,
    onFinished() {
      setMounted(false);
    },
  });

  const state: MenuRadioItemIndicator.State = React.useMemo(
    () => ({
      checked: item.checked,
      disabled: item.disabled,
      highlighted: item.highlighted,
      transitionStatus,
    }),
    [item.checked, item.disabled, item.highlighted, transitionStatus],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getItemProps,
    render: render || 'span',
    className,
    state,
    customStyleHookMapping: itemMapping,
    extraProps: other,
    ref: mergedRef,
  });

  const shouldRender = keepMounted || item.checked;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace MenuRadioItemIndicator {
  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Whether to keep the HTML element in the DOM when the radio item is inactive.
     * @default false
     */
    keepMounted?: boolean;
  }

  export interface State {
    /**
     * Whether the radio item is currently selected.
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

MenuRadioItemIndicator.propTypes /* remove-proptypes */ = {
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
   * Whether to keep the HTML element in the DOM when the radio item is inactive.
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

export { MenuRadioItemIndicator };

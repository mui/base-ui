'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { CompositeItem } from '../../composite/item/CompositeItem';

const EMPTY_OBJECT = {};
/**
 * A button that can be used as-is or as a trigger for other components.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
const ToolbarButton = React.forwardRef(function ToolbarButton(
  props: ToolbarButton.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, disabled, render, ...otherProps } = props;

  const { getButtonProps } = useButton({
    buttonRef: forwardedRef,
    disabled,
    focusableWhenDisabled: true,
    type: 'button',
  });

  const { renderElement } = useComponentRenderer({
    propGetter: getButtonProps,
    render: render ?? 'button',
    state: EMPTY_OBJECT,
    className,
    extraProps: otherProps,
  });

  return <CompositeItem render={renderElement()} />;
});

export namespace ToolbarButton {
  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * @default false
     */
    disabled?: boolean;
  }

  export interface State {}
}

export { ToolbarButton };

ToolbarButton.propTypes /* remove-proptypes */ = {
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
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { CompositeItem } from '../../composite/item/CompositeItem';
import type { ToolbarRoot, ToolbarItemMetadata } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';
import { useToolbarGroupContext } from '../group/ToolbarGroupContext';
import { useToolbarInput } from './useToolbarInput';
/**
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
const ToolbarInput = React.forwardRef(function ToolbarInput(
  props: ToolbarInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const {
    className,
    focusableWhenDisabled = true,
    render,
    disabled: disabledProp = false,
    ...otherProps
  } = props;

  const { disabled: toolbarDisabled, orientation } = useToolbarRootContext();

  const groupContext = useToolbarGroupContext(true);

  const itemMetadata = React.useMemo(() => ({ focusableWhenDisabled }), [focusableWhenDisabled]);

  const disabled = toolbarDisabled || (groupContext?.disabled ?? false) || disabledProp;

  const { getInputProps } = useToolbarInput({
    ref: forwardedRef,
    disabled,
    focusableWhenDisabled,
  });

  const state: ToolbarInput.State = React.useMemo(
    () => ({
      disabled,
      orientation,
      focusable: focusableWhenDisabled,
    }),
    [disabled, focusableWhenDisabled, orientation],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getInputProps,
    render: render ?? 'input',
    state,
    className,
    extraProps: otherProps,
  });

  return <CompositeItem<ToolbarItemMetadata> metadata={itemMetadata} render={renderElement()} />;
});

export namespace ToolbarInput {
  export interface State extends ToolbarRoot.State {
    disabled: boolean;
    focusable: boolean;
  }

  export interface Props extends BaseUIComponentProps<'button', ToolbarRoot.State> {
    /**
     * When `true` the item is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * When `true` the item remains focuseable when disabled.
     * @default true
     */
    focusableWhenDisabled?: boolean;
  }
}

export { ToolbarInput };

ToolbarInput.propTypes /* remove-proptypes */ = {
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
   * When `true` the item is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * When `true` the item remains focuseable when disabled.
   * @default true
   */
  focusableWhenDisabled: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

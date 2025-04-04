'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { CompositeItem } from '../../composite/item/CompositeItem';
import type { ToolbarRoot, ToolbarItemMetadata } from '../root/ToolbarRoot';
import { useToolbarRootContext } from '../root/ToolbarRootContext';
import { useToolbarGroupContext } from '../group/ToolbarGroupContext';
import { button } from '../../utils/renderFunctions';

/**
 * A button that can be used as-is or as a trigger for other components.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
const ToolbarButton = React.forwardRef(function ToolbarButton(
  componentProps: ToolbarButton.Props,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    className,
    render,
    disabled: disabledProp = false,
    focusableWhenDisabled = true,
    ...intrinsicProps
  } = componentProps;

  const { disabled: toolbarDisabled, orientation } = useToolbarRootContext();

  const groupContext = useToolbarGroupContext(true);

  const itemMetadata = React.useMemo(() => ({ focusableWhenDisabled }), [focusableWhenDisabled]);

  const disabled = toolbarDisabled || (groupContext?.disabled ?? false) || disabledProp;

  const { getButtonProps } = useButton({
    buttonRef: ref,
    disabled,
    focusableWhenDisabled,
  });

  const state: ToolbarButton.State = React.useMemo(
    () => ({
      disabled,
      orientation,
      focusable: focusableWhenDisabled,
    }),
    [disabled, focusableWhenDisabled, orientation],
  );

  const derivedProps: React.ComponentProps<'button'> = {
    disabled,
  };

  const renderElement = useRenderElement(button, componentProps, {
    state,
    ref,
    props: [intrinsicProps, derivedProps, getButtonProps],
  });

  return <CompositeItem<ToolbarItemMetadata> metadata={itemMetadata} render={renderElement()} />;
});

namespace ToolbarButton {
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

export { ToolbarButton };

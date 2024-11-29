'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { NOOP } from '../../utils/noop';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { useToggleButtonGroupRootContext } from '../root/ToggleButtonGroupRootContext';
import { useToggleButtonGroupItem } from './useToggleButtonGroupItem';

const customStyleHookMapping = {
  disabled: () => null,
};
/**
 *
 * Demos:
 *
 * - [ToggleButtonGroup](https://base-ui.com/components/react-toggle-button-group/)
 *
 * API:
 *
 * - [ToggleButtonGroupItem API](https://base-ui.com/components/react-toggle-button-group/#api-reference-ToggleButtonGroupItem)
 */
const ToggleButtonGroupItem = React.forwardRef(function ToggleButtonGroupItem(
  props: ToggleButtonGroupItem.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    value,
    disabled: disabledProp,
    onPressedChange = NOOP,
    className,
    render,
    type, // cannot change button type
    form, // never participates in form validation
    ...otherProps
  } = props;

  const {
    value: groupValue,
    setGroupValue,
    disabled: groupDisabled,
  } = useToggleButtonGroupRootContext();

  const { disabled, pressed, getRootProps } = useToggleButtonGroupItem({
    value,
    groupValue,
    setGroupValue,
    disabled: disabledProp || groupDisabled,
    onPressedChange,
    itemRef: forwardedRef,
  });

  const state: ToggleButtonGroupItem.State = React.useMemo(
    () => ({
      disabled,
      pressed,
    }),
    [disabled, pressed],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'button',
    ref: forwardedRef,
    state,
    className,
    customStyleHookMapping,
    extraProps: otherProps,
  });

  return <CompositeItem render={renderElement()} />;
});

export { ToggleButtonGroupItem };

export namespace ToggleButtonGroupItem {
  export interface State {
    pressed: boolean;
    disabled: boolean;
  }

  export interface Props
    extends Pick<useToggleButtonGroupItem.Parameters, 'value'>,
      Omit<BaseUIComponentProps<'button', State>, 'value'> {
    /**
     * The label for the toggle button.
     */
    'aria-label'?: React.AriaAttributes['aria-label'];
    /**
     * An id or space-separated list of ids of elements that label the toggle button.
     */
    'aria-labelledby'?: React.AriaAttributes['aria-labelledby'];
    /**
     * Callback fired when the pressed state is changed.
     *
     * @param {boolean} pressed The new pressed state.
     * @param {Event} event The event source of the callback.
     */
    onPressedChange?: (pressed: boolean, event: Event) => void;
  }
}

ToggleButtonGroupItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The label for the toggle button.
   */
  'aria-label': PropTypes.string,
  /**
   * An id or space-separated list of ids of elements that label the toggle button.
   */
  'aria-labelledby': PropTypes.string,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  disabled: PropTypes.bool,
  /**
   * @ignore
   */
  form: PropTypes.string,
  /**
   * Callback fired when the pressed state is changed.
   *
   * @param {boolean} pressed The new pressed state.
   * @param {Event} event The event source of the callback.
   *
   * @default NOOP
   */
  onPressedChange: PropTypes.func,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  type: PropTypes.oneOf(['button', 'reset', 'submit']),
  /**
   * A unique string that identifies the component when used
   * inside a ToggleButtonGroup
   */
  value: PropTypes.string.isRequired,
} as any;

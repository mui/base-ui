'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { NOOP } from '../../utils/noop';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { CompositeItem } from '../../composite/item/CompositeItem';
import { useToggleGroupRootContext } from '../../toggle-group/root/ToggleGroupRootContext';
import { useToggleRoot } from './useToggleRoot';

const customStyleHookMapping = {
  disabled: () => null,
};
/**
 *
 * Demos:
 *
 * - [Toggle](https://base-ui.com/components/react-toggle/)
 *
 * API:
 *
 * - [ToggleRoot API](https://base-ui.com/components/react-toggle/#api-reference-ToggleRoot)
 */
const ToggleRoot = React.forwardRef(function ToggleRoot(
  props: ToggleRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    className,
    defaultPressed = false,
    disabled: disabledProp = false,
    form, // never participates in form validation
    onPressedChange: onPressedChangeProp,
    pressed: pressedProp,
    render,
    type, // cannot change button type
    value: valueProp,
    ...otherProps
  } = props;

  const groupContext = useToggleGroupRootContext();

  const groupValue = groupContext?.value ?? [];

  const { disabled, pressed, getRootProps } = useToggleRoot({
    buttonRef: forwardedRef,
    defaultPressed: groupContext ? undefined : defaultPressed,
    disabled: (disabledProp || groupContext?.disabled) ?? false,
    onPressedChange: onPressedChangeProp ?? NOOP,
    pressed: groupContext && valueProp ? groupValue?.indexOf(valueProp) > -1 : pressedProp,
    setGroupValue: groupContext?.setGroupValue ?? NOOP,
    value: valueProp ?? '',
  });

  const state: ToggleRoot.State = React.useMemo(
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

  return groupContext ? <CompositeItem render={renderElement()} /> : renderElement();
});

export { ToggleRoot };

export namespace ToggleRoot {
  export interface State {
    pressed: boolean;
    disabled: boolean;
  }

  export interface Props
    extends Partial<
        Pick<
          useToggleRoot.Parameters,
          'pressed' | 'defaultPressed' | 'disabled' | 'onPressedChange' | 'value'
        >
      >,
      Omit<BaseUIComponentProps<'button', State>, 'value'> {
    /**
     * The label for the Toggle.
     */
    'aria-label'?: React.AriaAttributes['aria-label'];
    /**
     * An id or space-separated list of ids of elements that label the Toggle.
     */
    'aria-labelledby'?: React.AriaAttributes['aria-labelledby'];
  }
}

ToggleRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The label for the Toggle.
   */
  'aria-label': PropTypes.string,
  /**
   * An id or space-separated list of ids of elements that label the Toggle.
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
   * The default pressed state. Use when the component is not controlled.
   * @default false
   */
  defaultPressed: PropTypes.bool,
  /**
   * If `true`, the component is disabled.
   * @default false
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
   */
  onPressedChange: PropTypes.func,
  /**
   * If `true`, the component is pressed.
   */
  pressed: PropTypes.bool,
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
   * inside a ToggleGroup.
   */
  value: PropTypes.string,
} as any;

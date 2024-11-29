'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { NOOP } from '../../utils/noop';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { useToggleButtonRoot } from './useToggleButtonRoot';

const customStyleHookMapping = {
  disabled: () => null,
};

/**
 *
 * Demos:
 *
 * - [ToggleButton](https://base-ui.com/components/react-toggle-button/)
 *
 * API:
 *
 * - [ToggleButtonRoot API](https://base-ui.com/components/react-toggle-button/#api-reference-ToggleButtonRoot)
 */
const ToggleButtonRoot = React.forwardRef(function ToggleButtonRoot(
  props: ToggleButtonRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    pressed: pressedProp,
    defaultPressed: defaultPressedProp,
    disabled: disabledProp = false,
    onPressedChange = NOOP,
    className,
    render,
    type,
    form,
    ...otherProps
  } = props;

  const { disabled, pressed, getRootProps } = useToggleButtonRoot({
    pressed: pressedProp,
    defaultPressed: defaultPressedProp,
    disabled: disabledProp,
    onPressedChange,
    buttonRef: forwardedRef,
  });

  const state: ToggleButtonRoot.State = React.useMemo(
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

  return renderElement();
});

export { ToggleButtonRoot };

export namespace ToggleButtonRoot {
  export interface State {
    pressed: boolean;
    disabled: boolean;
  }

  export interface Props
    extends Partial<
        Pick<
          useToggleButtonRoot.Parameters,
          'pressed' | 'defaultPressed' | 'disabled' | 'onPressedChange'
        >
      >,
      BaseUIComponentProps<'button', State> {
    /**
     * The label for the ToggleButton.
     */
    'aria-label'?: React.AriaAttributes['aria-label'];
    /**
     * An id or space-separated list of ids of elements that label the ToggleButton.
     */
    'aria-labelledby'?: React.AriaAttributes['aria-labelledby'];
  }
}

ToggleButtonRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The label for the ToggleButton.
   */
  'aria-label': PropTypes.string,
  /**
   * An id or space-separated list of ids of elements that label the ToggleButton.
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
   *
   * @default false
   */
  defaultPressed: PropTypes.bool,
  /**
   * If `true`, the component is disabled.
   *
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
   *
   * @default NOOP
   */
  onPressedChange: PropTypes.func,
  /**
   * If `true`, the component is pressed.
   *
   * @default undefined
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
} as any;

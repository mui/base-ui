import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeReactProps } from '../../utils/mergeReactProps';

const FormSubmit = React.forwardRef(function FormSubmit(
  props: FormSubmit.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, className, disabled, ...otherProps } = props;

  const getSubmitProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'button'>(externalProps, {
        type: 'submit',
        'aria-disabled': disabled || undefined,
        onClick(event) {
          // Stop the form from submitting if the button is disabled.
          if (disabled) {
            event.preventDefault();
          }
        },
      }),
    [disabled],
  );

  const ownerState = React.useMemo<FormSubmit.OwnerState>(() => ({}), []);

  const { renderElement } = useComponentRenderer({
    propGetter: getSubmitProps,
    render: render ?? 'button',
    ref: forwardedRef,
    ownerState,
    className,
    extraProps: otherProps,
  });

  return renderElement();
});

FormSubmit.propTypes /* remove-proptypes */ = {
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
   * @ignore
   */
  disabled: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { FormSubmit };

namespace FormSubmit {
  export interface Props extends BaseUIComponentProps<'button', {}> {}
  export interface OwnerState {}
}

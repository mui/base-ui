'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useSelectTrigger } from './useSelectTrigger';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { commonStyleHooks } from '../utils/commonStyleHooks';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.netlify.app/components/react-select/)
 *
 * API:
 *
 * - [SelectTrigger API](https://base-ui.netlify.app/components/react-select/#api-reference-SelectTrigger)
 */
const SelectTrigger = React.forwardRef(function SelectTrigger(
  props: SelectTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    render,
    className,
    id: idProp,
    disabled: disabledProp = false,
    label,
    ...otherProps
  } = props;

  const { ownerState: fieldOwnerState, disabled: fieldDisabled } = useFieldRootContext();

  const {
    getTriggerProps: getRootTriggerProps,
    disabled: selectDisabled,
    open,
  } = useSelectRootContext();

  const disabled = fieldDisabled || selectDisabled || disabledProp;

  const { getTriggerProps } = useSelectTrigger({
    disabled,
    rootRef: forwardedRef,
  });

  const ownerState: SelectTrigger.OwnerState = React.useMemo(
    () => ({
      ...fieldOwnerState,
      open,
    }),
    [fieldOwnerState, open],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState,
    propGetter: (externalProps) => getTriggerProps(getRootTriggerProps(externalProps)),
    customStyleHookMapping: commonStyleHooks,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace SelectTrigger {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    children?: React.ReactNode;
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * If `true`, allows a disabled button to receive focus.
     * @default false
     */
    focusableWhenDisabled?: boolean;
    /**
     * Label of the button
     */
    label?: string;
  }

  export interface OwnerState {
    open: boolean;
  }
}

SelectTrigger.propTypes /* remove-proptypes */ = {
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
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, allows a disabled button to receive focus.
   * @default false
   */
  focusableWhenDisabled: PropTypes.bool,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * Label of the button
   */
  label: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectTrigger };

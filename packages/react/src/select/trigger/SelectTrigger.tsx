'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useSelectTrigger } from './useSelectTrigger';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';

/**
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

  const { state: fieldState, disabled: fieldDisabled } = useFieldRootContext();

  const { getRootTriggerProps, disabled: selectDisabled, open } = useSelectRootContext();

  const disabled = fieldDisabled || selectDisabled || disabledProp;

  const { getTriggerProps } = useSelectTrigger({
    disabled,
    rootRef: forwardedRef,
  });

  const state: SelectTrigger.State = React.useMemo(
    () => ({
      ...fieldState,
      open,
    }),
    [fieldState, open],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
    propGetter: (externalProps) => getTriggerProps(getRootTriggerProps(externalProps)),
    customStyleHookMapping: pressableTriggerOpenStateMapping,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace SelectTrigger {
  export interface Props extends BaseUIComponentProps<'div', State> {
    children?: React.ReactNode;
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * Label of the button
     */
    label?: string;
  }

  export interface State {
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

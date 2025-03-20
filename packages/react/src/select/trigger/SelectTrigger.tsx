'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useSelectTrigger } from './useSelectTrigger';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useComponentRenderer } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { fieldValidityMapping } from '../../field/utils/constants';

/**
 * A button that opens the select menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectTrigger = React.forwardRef(function SelectTrigger(
  props: SelectTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { render, className, disabled: disabledProp = false, ...otherProps } = props;

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
      disabled,
    }),
    [fieldState, open, disabled],
  );

  const styleHookMapping = React.useMemo(
    () => ({
      ...pressableTriggerOpenStateMapping,
      ...fieldValidityMapping,
    }),
    [],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
    propGetter: (externalProps) => getTriggerProps(getRootTriggerProps(externalProps)),
    customStyleHookMapping: styleHookMapping,
    extraProps: otherProps,
  });

  return renderElement();
});

namespace SelectTrigger {
  export interface Props extends BaseUIComponentProps<'div', State> {
    children?: React.ReactNode;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
  }

  export interface State {
    /**
     * Whether the select menu is currently open.
     */
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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Whether the component should ignore user interaction.
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

export { SelectTrigger };

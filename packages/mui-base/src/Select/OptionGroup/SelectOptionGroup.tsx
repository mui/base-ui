'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { SelectOptionGroupContext } from './SelectOptionGroupContext';
import { useSelectRootContext } from '../Root/SelectRootContext';

const SelectOptionGroup = React.forwardRef(function SelectOptionGroup(
  props: SelectOptionGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const { open } = useSelectRootContext();

  const [labelId, setLabelId] = React.useState<string | undefined>();

  const ownerState: SelectOptionGroup.OwnerState = React.useMemo(
    () => ({
      open,
    }),
    [open],
  );

  const getSelectOptionGroupProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        role: 'group',
        'aria-labelledby': labelId,
      }),
    [labelId],
  );

  const contextValue: SelectOptionGroupContext = React.useMemo(
    () => ({
      labelId,
      setLabelId,
    }),
    [labelId, setLabelId],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getSelectOptionGroupProps,
    render: render ?? 'div',
    ref: forwardedRef,
    ownerState,
    className,
    extraProps: otherProps,
  });

  return (
    <SelectOptionGroupContext.Provider value={contextValue}>
      {renderElement()}
    </SelectOptionGroupContext.Provider>
  );
});

SelectOptionGroup.propTypes /* remove-proptypes */ = {
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

namespace SelectOptionGroup {
  export interface OwnerState {
    open: boolean;
  }
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}
}

export { SelectOptionGroup };

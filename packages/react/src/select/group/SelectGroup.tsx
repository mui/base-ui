'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { SelectGroupContext } from './SelectGroupContext';

const state = {};

/**
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectGroup = React.forwardRef(function SelectGroup(
  props: SelectGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const [labelId, setLabelId] = React.useState<string | undefined>();

  const getSelectItemGroupProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        role: 'group',
        'aria-labelledby': labelId,
      }),
    [labelId],
  );

  const contextValue: SelectGroupContext = React.useMemo(
    () => ({
      labelId,
      setLabelId,
    }),
    [labelId, setLabelId],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getSelectItemGroupProps,
    render: render ?? 'div',
    ref: forwardedRef,
    state,
    className,
    extraProps: otherProps,
  });

  return (
    <SelectGroupContext.Provider value={contextValue}>
      {renderElement()}
    </SelectGroupContext.Provider>
  );
});

namespace SelectGroup {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}

SelectGroup.propTypes /* remove-proptypes */ = {
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

export { SelectGroup };

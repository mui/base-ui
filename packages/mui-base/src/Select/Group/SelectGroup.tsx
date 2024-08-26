import * as React from 'react';
import PropTypes from 'prop-types';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { SelectGroupContext } from './SelectGroupContext';

const SelectGroup = React.forwardRef(function SelectGroup(
  props: SelectGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const [labelId, setLabelId] = React.useState<string | undefined>();

  const ownerState: SelectGroup.OwnerState = React.useMemo(() => ({}), []);

  const getSelectGroupProps = React.useCallback(
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
    propGetter: getSelectGroupProps,
    render: render ?? 'div',
    ref: forwardedRef,
    ownerState,
    className,
    extraProps: otherProps,
  });

  return (
    <SelectGroupContext.Provider value={contextValue}>
      {renderElement()}
    </SelectGroupContext.Provider>
  );
});

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

namespace SelectGroup {
  export interface OwnerState {}
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}
}

export { SelectGroup };

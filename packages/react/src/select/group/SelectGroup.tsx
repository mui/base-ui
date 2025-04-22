'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { mergeProps } from '../../merge-props';
import { SelectGroupContext } from './SelectGroupContext';

const state = {};

/**
 * Groups related select items with the corresponding label.
 * Renders a `<div>` element.
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
      mergeProps(
        {
          role: 'group',
          'aria-labelledby': labelId,
        },
        externalProps,
      ),
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

export { SelectGroup };

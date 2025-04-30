'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { SelectGroupContext } from './SelectGroupContext';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Groups related select items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectGroup = React.forwardRef(function SelectGroup(
  componentProps: SelectGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const [labelId, setLabelId] = React.useState<string | undefined>();

  const contextValue: SelectGroupContext = React.useMemo(
    () => ({
      labelId,
      setLabelId,
    }),
    [labelId, setLabelId],
  );

  const renderElement = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      {
        role: 'group',
        'aria-labelledby': labelId,
      },
      elementProps,
    ],
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

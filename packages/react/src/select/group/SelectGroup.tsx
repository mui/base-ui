'use client';
import * as React from 'react';
import { warn } from '@base-ui/utils/warn';
import type { BaseUIComponentProps } from '../../internals/types';
import { SelectGroupContext } from './SelectGroupContext';
import { useSelectVirtualGroupContext } from './SelectVirtualGroupContext';
import { useSelectVirtualItemContext } from '../item/SelectVirtualItemContext';
import { useRenderElement } from '../../internals/useRenderElement';

/**
 * Groups related select items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectGroup = React.forwardRef(function SelectGroup(
  componentProps: SelectGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    /* eslint-disable react-hooks/rules-of-hooks */
    const virtualGroup = useSelectVirtualGroupContext();
    const virtualItem = useSelectVirtualItemContext();
    React.useEffect(() => {
      if (virtualGroup != null || virtualItem != null) {
        warn(
          '<Select.Group> was rendered inside <Virtualizer>, which wraps each group in its own ' +
            '`role="group"` element. Return only <Select.GroupLabel> from `renderGroupHeader`.',
        );
      }
    }, [virtualGroup, virtualItem]);
    /* eslint-enable react-hooks/rules-of-hooks */
  }

  const [labelId, setLabelId] = React.useState<string | undefined>();

  const contextValue: SelectGroupContext = React.useMemo(
    () => ({
      labelId,
      setLabelId,
    }),
    [labelId, setLabelId],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      {
        role: 'group',
        'aria-labelledby': labelId,
      },
      elementProps,
    ],
  });

  return <SelectGroupContext.Provider value={contextValue}>{element}</SelectGroupContext.Provider>;
});

export interface SelectGroupState {}

export interface SelectGroupProps extends BaseUIComponentProps<'div', SelectGroupState> {}

export namespace SelectGroup {
  export type State = SelectGroupState;
  export type Props = SelectGroupProps;
}

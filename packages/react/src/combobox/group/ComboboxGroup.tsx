'use client';
import * as React from 'react';
import { warn } from '@base-ui/utils/warn';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { ComboboxGroupContext } from './ComboboxGroupContext';
import { useComboboxVirtualGroupContext } from './ComboboxVirtualGroupContext';
import { GroupCollectionProvider } from '../collection/GroupCollectionContext';
import { useComboboxVirtualItemContext } from '../item/ComboboxVirtualItemContext';
import { useComboboxRootContext } from '../root/ComboboxRootContext';

/**
 * Groups related items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxGroup = React.forwardRef(function ComboboxGroup(
  componentProps: ComboboxGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, items, ...elementProps } = componentProps;

  const store = useComboboxRootContext();
  const grid = store.useState('grid');

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    /* eslint-disable react-hooks/rules-of-hooks */
    const virtualGroup = useComboboxVirtualGroupContext();
    const virtualItem = useComboboxVirtualItemContext();
    React.useEffect(() => {
      if (virtualGroup != null || virtualItem != null) {
        warn(
          `<${store.context.componentName}.Group> was rendered inside <Virtualizer>, which ` +
            'wraps each group in its own `role="group"` element. Return only ' +
            `<${store.context.componentName}.GroupLabel> from \`renderGroupHeader\`.`,
        );
      }
    }, [store, virtualGroup, virtualItem]);
    /* eslint-enable react-hooks/rules-of-hooks */
  }

  const [labelId, setLabelId] = React.useState<string | undefined>();

  const contextValue = React.useMemo(
    () => ({
      labelId,
      setLabelId,
      items,
    }),
    [labelId, setLabelId, items],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      {
        // `group` is not a valid owned element of `grid`, and `row` must be owned
        // by `grid`, `rowgroup`, or `treegrid`.
        role: grid ? 'rowgroup' : 'group',
        'aria-labelledby': labelId,
      },
      elementProps,
    ],
  });

  const wrappedElement = (
    <ComboboxGroupContext.Provider value={contextValue}>{element}</ComboboxGroupContext.Provider>
  );

  if (items) {
    return <GroupCollectionProvider items={items}>{wrappedElement}</GroupCollectionProvider>;
  }

  return wrappedElement;
});

export interface ComboboxGroupState {}

export interface ComboboxGroupProps extends BaseUIComponentProps<'div', ComboboxGroupState> {
  /**
   * Items to be rendered within this group.
   * When provided, child `Collection` components will use these items.
   */
  items?: readonly any[] | undefined;
}

export namespace ComboboxGroup {
  export type State = ComboboxGroupState;
  export type Props = ComboboxGroupProps;
}

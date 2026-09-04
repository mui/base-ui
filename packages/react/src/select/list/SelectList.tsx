'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { warn } from '@base-ui/utils/warn';
import type { BaseUIComponentProps, BaseUIEvent, HTMLProps } from '../../internals/types';
import { useSelectRootContext, useSelectRootPropsContext } from '../root/SelectRootContext';
import { useSelectVirtualizer } from '../root/SelectVirtualizationContext';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { shouldScrollActiveIntoView } from '../../internals/list/scrollActivation';
import { mergeProps } from '../../merge-props';
import { styleDisableScrollbar } from '../../utils/styles';
import { LIST_FUNCTIONAL_STYLES, SCROLLPORT_FUNCTIONAL_STYLES } from '../popup/utils';
import {
  ListVirtualizationHostContext,
  ListVirtualizationListStateContext,
  type ListVirtualizationHost,
  type ListVirtualizationListState,
} from '../../internals/virtualization/ListVirtualizationHostContext';
import { SelectVirtualItemContext } from '../item/SelectVirtualItemContext';
import { getSelectCollection, type SelectCollection } from '../utils/getSelectCollection';

/**
 * A container for the select items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectList = React.forwardRef(function SelectList(
  componentProps: SelectList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;

  const store = useSelectRootContext();
  const { multiple, readOnly } = useSelectRootPropsContext();
  const { alignItemWithTriggerActive, alignItemWithTriggerExplicit } = useSelectPositionerContext();
  const registeredVirtualizer = useSelectVirtualizer();

  const hasScrollArrows = store.useState('hasScrollArrows');
  const openMethod = store.useState('openMethod');
  const id = store.useState('id');
  const items = store.useState('items');
  const { componentName } = store.context;

  const collection = React.useMemo(() => getSelectCollection(items), [items]);
  const virtualized = registeredVirtualizer != null;

  const scrollbarClassName =
    hasScrollArrows && openMethod !== 'touch' ? styleDisableScrollbar.className : undefined;

  const handleInternalScroll = useStableCallback(
    (event: BaseUIEvent<React.UIEvent<HTMLDivElement>>) => {
      store.context.scrollHandlerRef.current?.(event.currentTarget);
    },
  );

  // Composed rather than called directly, so the application's handler keeps running first and
  // keeps being able to stop this one with `preventBaseUIHandler()` — the same order `mergeProps`
  // gives it on a static list.
  const scrollportProps = React.useMemo<HTMLProps>(
    () =>
      mergeProps<'div'>(
        {
          className: scrollbarClassName,
          onScroll: handleInternalScroll,
          // Reached only on the virtualizer's first render, before its registration commits — and
          // in server-rendered markup, which is why the branch is kept rather than deleted. Once
          // registration lands, align mode is off and these are removed.
          ...(alignItemWithTriggerActive ? { style: SCROLLPORT_FUNCTIONAL_STYLES } : null),
        },
        { onScroll: componentProps.onScroll },
      ),
    [scrollbarClassName, handleInternalScroll, componentProps.onScroll, alignItemWithTriggerActive],
  );

  // Reads the configuration at call time, so it stays stable while reporting current values.
  const warnUnsupportedConfiguration = useStableCallback(() => {
    switch (getSelectCollection(store.state.items).problem) {
      case 'missing':
        warn(`<Virtualizer> requires the \`items\` prop on <${componentName}.Root>.`);
        break;
      case 'grouped':
        warn(
          '<Virtualizer> does not currently support grouped collections. ' +
            'Render a flat item collection instead.',
        );
        break;
      case 'record':
        warn(
          `<Virtualizer> requires the \`items\` prop on <${componentName}.Root> to be an array. ` +
            'A label map has no ordering the list can window; pass an array of values, or of ' +
            '`{ label, value }` entries.',
        );
        break;
      default:
        break;
    }

    if (alignItemWithTriggerExplicit) {
      warn(
        `<${componentName}.Positioner> received \`alignItemWithTrigger\`, which a virtualized ` +
          'list does not support: the virtualizer owns the scrolling element, so the mode has ' +
          "nothing to measure against. It follows the virtualizer's presence, not whether it is " +
          'currently windowing, so it is off for `enabled={false}` too. It has been turned off.',
      );
    }
  });

  // Kept free of reactive state: `<Select.Item>` reads this to detect that it is inside a list.
  const virtualizationHost = React.useMemo<ListVirtualizationHost>(
    () => ({
      componentName,
      registry: store.context.virtualizationRegistry,
      virtualItemContext: SelectVirtualItemContext,
      warnUnsupportedConfiguration:
        process.env.NODE_ENV === 'production' ? undefined : warnUnsupportedConfiguration,
    }),
    [componentName, store, warnUnsupportedConfiguration],
  );

  const defaultProps: HTMLProps = {
    id: `${id}-list`,
    role: 'listbox',
    'aria-multiselectable': multiple || undefined,
    'aria-readonly': readOnly || undefined,
    // Both move to the virtualizer's scrollport while one is registered — a scroll event does not
    // bubble, so a handler left here would never fire for the element that actually scrolls.
    ...(virtualized ? null : { onScroll: handleInternalScroll, className: scrollbarClassName }),
    // A registered virtualizer suppresses aligned placement, so this cannot be reached while one
    // is present; the scrollport carries the equivalent styles in that case.
    ...(alignItemWithTriggerActive ? { style: LIST_FUNCTIONAL_STYLES } : null),
  };

  const setListElement = store.useStateSetter('listElement');

  // While virtualized the application's own handler has moved onto the scrollport, so it must not
  // also be attached here, where no scroll event will ever reach it.
  const outerProps = virtualized ? { ...elementProps, onScroll: undefined } : elementProps;

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setListElement],
    props: [defaultProps, outerProps],
  });

  return (
    <ListVirtualizationHostContext.Provider value={virtualizationHost}>
      <SelectVirtualizationState collection={collection} scrollportProps={scrollportProps}>
        {element}
      </SelectVirtualizationState>
    </ListVirtualizationHostContext.Provider>
  );
});

interface SelectVirtualizationStateProps {
  children: React.ReactNode;
  collection: SelectCollection;
  scrollportProps: HTMLProps;
}

/**
 * Publishes the reactive state a `<Virtualizer>` windows against.
 *
 * Separate from `SelectList` so the highlight subscriptions live here: only `<Virtualizer>` reads
 * them, and a static list has none, so subscribing in the list itself would re-render it on every
 * highlight change — a cost it never paid before. Re-rendering this component leaves `children`
 * referentially unchanged, so the list element below it is not reconciled again.
 */
function SelectVirtualizationState(props: SelectVirtualizationStateProps) {
  const { children, collection, scrollportProps } = props;

  const store = useSelectRootContext();
  const activeIndex = store.useState('activeIndex');
  const highlightType = store.useState('highlightType');

  const value = React.useMemo<ListVirtualizationListState>(
    () => ({
      activeIndex,
      items: collection.items,
      scrollActiveIntoView: shouldScrollActiveIntoView(highlightType),
      // `Select` never suspends windowing: its autofill matches against the values and labels the
      // root derives from `items`, so it never needs every row mounted.
      scrollportProps,
    }),
    [activeIndex, collection.items, highlightType, scrollportProps],
  );

  return (
    <ListVirtualizationListStateContext.Provider value={value}>
      {children}
    </ListVirtualizationListStateContext.Provider>
  );
}

export interface SelectListProps extends BaseUIComponentProps<'div', SelectListState> {}

export interface SelectListState {}

export namespace SelectList {
  export type Props = SelectListProps;
  export type State = SelectListState;
}

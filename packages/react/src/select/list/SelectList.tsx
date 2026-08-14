'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { styleDisableScrollbar } from '../../utils/styles';
import { LIST_FUNCTIONAL_STYLES } from '../popup/utils';
import { selectors } from '../store';
import { SelectCollection } from '../collection/SelectCollection';

const SELECT_LIST_ROLE = 'listbox';

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
  const { store, scrollHandlerRef, multiple } = useSelectRootContext();
  const { alignItemWithTriggerActive } = useSelectPositionerContext();
  const rootId = useStore(store, selectors.id);
  // Resolve once so the list registration uses the same id the DOM element ends up with.
  const id = componentProps.id ?? `${rootId}-list`;
  const { children } = componentProps;

  // Closed-template API: a function child reads the root's items, so consumers don't have to
  // wrap it in `Select.Collection` themselves.
  const resolvedChildren = React.useMemo(() => {
    if (typeof children === 'function') {
      return <SelectCollection>{children}</SelectCollection>;
    }
    return children;
  }, [children]);

  const listProps = { ...componentProps, id, children: resolvedChildren };
  const { render, className, style, ...elementProps } = listProps;

  const hasScrollArrows = useStore(store, selectors.hasScrollArrows);
  const openMethod = useStore(store, selectors.openMethod);
  const virtualFocus = useStore(store, selectors.virtualFocus);

  const defaultProps: HTMLProps = {
    id,
    role: SELECT_LIST_ROLE,
    'aria-multiselectable': multiple || undefined,
    onScroll(event) {
      scrollHandlerRef.current?.(event.currentTarget);
    },
    onFocus(event) {
      if (!virtualFocus && event.target === event.currentTarget) {
        store.set('activeIndex', null);
      }
    },
    onKeyDown(event) {
      // Unlike the menu, the select cannot reset whenever the input regains focus: the open
      // sequence focuses the input after the selected item is seeded, which would clear the
      // open highlight. Reset only when tabbing back out of the focused list.
      if (event.key === 'Tab' && event.shiftKey) {
        store.set('activeIndex', null);
      }
    },
    ...(alignItemWithTriggerActive && {
      style: LIST_FUNCTIONAL_STYLES,
    }),
    className:
      hasScrollArrows && openMethod !== 'touch' ? styleDisableScrollbar.className : undefined,
  };

  const setListElement = store.useStateSetter('listElement');

  const element = useRenderElement('div', listProps, {
    ref: [forwardedRef, setListElement],
    props: [defaultProps, elementProps],
  });

  return element;
});

export interface SelectListProps extends Omit<
  BaseUIComponentProps<'div', SelectListState>,
  'children'
> {
  /**
   * A function child renders one node per entry from the root's `items` prop, the same shape
   * `Select.Collection` accepts.
   */
  children?: React.ReactNode | ((item: any, index: number) => React.ReactNode);
}

export interface SelectListState {}

export namespace SelectList {
  export type Props = SelectListProps;
  export type State = SelectListState;
}

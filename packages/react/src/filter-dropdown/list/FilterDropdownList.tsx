'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFilterDropdownPopupContext } from '../popup/FilterDropdownPopupContext';
import { useFilterDropdownRootContext } from '../root/FilterDropdownRootContext';

/**
 * @internal
 */
export const FilterDropdownList = React.forwardRef(function FilterDropdownList(
  componentProps: FilterDropdownList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, id: idProp, ...elementProps } = componentProps;
  const rootContext = useFilterDropdownRootContext();
  const popupContext = useFilterDropdownPopupContext();
  const { setListId } = popupContext;
  const id = idProp ?? popupContext.listId;
  const hasAriaLabel = elementProps['aria-label'] || elementProps['aria-labelledby'];
  const ariaLabelledBy = hasAriaLabel ? elementProps['aria-labelledby'] : rootContext.triggerId;

  useIsoLayoutEffect(() => {
    setListId(id);
  }, [id, setListId]);

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      {
        role: 'menu',
        id,
        'aria-labelledby': ariaLabelledBy,
        // Out of the tab order, but programmatically focusable: WebKit only tracks
        // `aria-activedescendant` from the list element itself, so navigation moves DOM focus
        // here. Also prevents scrollable lists from being tabbable by default.
        tabIndex: -1,
        onMouseDown(event) {
          // Keep focus on the input when list content is pressed.
          event.preventDefault();
        },
        onKeyDown(event) {
          if (event.target !== event.currentTarget || event.nativeEvent.isComposing) {
            return;
          }
          const isTypingKey =
            (event.key.length === 1 && event.key !== ' ') || event.key === 'Backspace';
          const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
          if (isTypingKey && !hasModifier) {
            // The list only holds DOM focus under the WebKit compatibility behavior. Return
            // focus to the input without preventing default so the keystroke lands there.
            popupContext.inputRef.current?.focus({ preventScroll: true });
          }
        },
      },
      elementProps,
    ],
  });
});

export interface FilterDropdownListState {}

export interface FilterDropdownListProps extends BaseUIComponentProps<
  'div',
  FilterDropdownListState
> {
  id: string | undefined;
}

export namespace FilterDropdownList {
  export type Props = FilterDropdownListProps;
  export type State = FilterDropdownListState;
}

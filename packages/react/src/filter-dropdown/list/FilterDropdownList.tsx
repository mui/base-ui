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
        // A tab stop: VoiceOver + Safari doesn't track `aria-activedescendant` from the input,
        // so ATs can tab onto the list and navigate from it instead (focus seeds the first item).
        tabIndex: 0,
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
            // Typing while the list holds DOM focus continues filtering: return focus to the
            // input without preventing default so the keystroke lands there.
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

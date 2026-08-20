'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useActiveItemId, useFilterDropdownRootContext } from '../root/FilterDropdownRootContext';
import { useRenderedId } from '../../internals/useRenderedId';
import { getTarget } from '../../floating-ui-react/utils';

/**
 * @internal
 */
export const FilterDropdownList = React.forwardRef(function FilterDropdownList(
  componentProps: FilterDropdownList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, id: idProp, ...elementProps } = componentProps;

  const context = useFilterDropdownRootContext();
  const { setListId } = context;
  const activeItemId = useActiveItemId(context);
  const renderedIdRef = useRenderedId(setListId, context.defaultListId, idProp != null);

  const id = idProp ?? context.defaultListId;
  const hasAriaLabel = elementProps['aria-label'] || elementProps['aria-labelledby'];
  const ariaLabelledBy = hasAriaLabel ? elementProps['aria-labelledby'] : context.triggerId;

  const defaultProps: HTMLProps = {
    role: 'menu',
    // Chromium includes scrollable elements in sequential focus navigation by default.
    tabIndex: -1,
    id,
    'aria-labelledby': ariaLabelledBy,
    'aria-activedescendant': context.hasInput ? undefined : activeItemId,
    onMouseDown(event) {
      if (
        getTarget(event.nativeEvent) === event.currentTarget &&
        !isScrollbarPress(event.currentTarget, event.nativeEvent)
      ) {
        // Keep focus on the virtual focus owner when the list background is pressed, while
        // allowing items and the scrollbar to receive their native pointer interactions.
        event.preventDefault();
      }
    },
    onPointerMove() {
      context.setKeyboardModality(false);
    },
    onPointerDown() {
      context.setKeyboardModality(false);
    },
    onKeyDown(event) {
      const isMainNavigationKey = event.key === 'ArrowUp' || event.key === 'ArrowDown';
      const isTypeaheadKey =
        event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
      if (!context.hasInput && (isMainNavigationKey || isTypeaheadKey)) {
        // The list consumed the reference navigation and typeahead handlers. Do not let the same
        // event reach the popup's floating handler and be handled a second time.
        event.stopPropagation();
      }
    },
  };

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, context.setListElement, renderedIdRef],
    props: [context.hasInput ? undefined : context.inputProps, defaultProps, elementProps],
  });
});

function isScrollbarPress(element: HTMLElement, event: MouseEvent) {
  const verticalScrollbarWidth = element.offsetWidth - element.clientWidth;
  const horizontalScrollbarHeight = element.offsetHeight - element.clientHeight;
  const isRtl = ownerWindow(element).getComputedStyle(element).direction === 'rtl';

  const pressedVerticalScrollbar =
    element.scrollHeight > element.clientHeight &&
    verticalScrollbarWidth > 0 &&
    (isRtl ? event.offsetX <= verticalScrollbarWidth : event.offsetX > element.clientWidth);
  const pressedHorizontalScrollbar =
    element.scrollWidth > element.clientWidth &&
    horizontalScrollbarHeight > 0 &&
    event.offsetY > element.clientHeight;

  return pressedVerticalScrollbar || pressedHorizontalScrollbar;
}

export interface FilterDropdownListState {}

export interface FilterDropdownListProps extends BaseUIComponentProps<
  'div',
  FilterDropdownListState
> {
  id?: string | undefined;
}

export namespace FilterDropdownList {
  export type Props = FilterDropdownListProps;
  export type State = FilterDropdownListState;
}

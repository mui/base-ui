'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useActiveItemId, useFilterDropdownRootContext } from '../root/FilterDropdownRootContext';
import { resolveRenderedId } from '../../internals/resolveRenderedId';
import { getTarget } from '../../floating-ui-react/utils';
import { resolveMenuPopupLabel } from '../../menu/popup/resolveMenuPopupLabel';

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

  const id = resolveRenderedId(componentProps, context.defaultListId);
  const registeredId = id === context.defaultListId ? undefined : id;
  const registerIdRef = React.useCallback(
    (element: HTMLElement | null) => setListId(element ? registeredId : undefined),
    [registeredId, setListId],
  );
  // Also inspects a label supplied through a `render` element, which never appears in
  // `elementProps`, so the trigger fallback doesn't override it.
  const { ariaLabelledBy } = resolveMenuPopupLabel(componentProps, null, context.triggerId ?? null);

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
    ref: [forwardedRef, context.setListElement, registerIdRef],
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

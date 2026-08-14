'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useActiveItemId, useFilterDropdownRootContext } from '../root/FilterDropdownRootContext';

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
  const id = idProp ?? context.listId;
  const hasAriaLabel = elementProps['aria-label'] || elementProps['aria-labelledby'];
  const ariaLabelledBy = hasAriaLabel ? elementProps['aria-labelledby'] : context.triggerId;

  useIsoLayoutEffect(() => {
    setListId(id);
  }, [id, setListId]);

  const defaultProps: HTMLProps = {
    role: 'menu',
    // Chromium includes scrollable elements in sequential focus navigation by default.
    tabIndex: -1,
    id,
    'aria-labelledby': ariaLabelledBy,
    'aria-activedescendant': context.hasInput ? undefined : activeItemId,
    onMouseDown(event) {
      // Keep focus on the virtual focus owner when list content is pressed.
      event.preventDefault();
    },
    onPointerMove() {
      context.setKeyboardModality(false);
    },
    onPointerDown() {
      context.setKeyboardModality(false);
    },
    onKeyDown(event) {
      if (!context.hasInput && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        // The list consumed the reference navigation handler. Do not let the same event reach the
        // popup's floating handler and move the virtual cursor a second time.
        event.stopPropagation();
      }
    },
  };

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, context.setListElement],
    props: [context.hasInput ? undefined : context.inputProps, defaultProps, elementProps],
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

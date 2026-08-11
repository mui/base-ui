'use client';
import * as React from 'react';
import { Store } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { getContainsFilter } from '../../internals/filter';
import type { BaseUIComponentProps } from '../../internals/types';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useItemRegistry } from '../../internals/useItemRegistry';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { popupStateMapping } from '../../utils/popupStateMapping';
import { getTarget } from '../../floating-ui-react/utils';
import {
  useFilterDropdownRootContext,
  useFilterDropdownValueContext,
} from '../root/FilterDropdownRootContext';
import {
  FilterDropdownPopupContext,
  type FilterDropdownItemRegistration,
} from './FilterDropdownPopupContext';
import type { State as StoreState } from '../store';

const stateAttributesMapping: StateAttributesMapping<FilterDropdownPopupState> = {
  open: popupStateMapping.open,
};

/**
 * @internal
 */
export const FilterDropdownPopup = React.forwardRef(function FilterDropdownPopup(
  componentProps: FilterDropdownPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { id: idProp, render, className, style, ...elementProps } = componentProps;
  const context = useFilterDropdownRootContext();
  const value = useFilterDropdownValueContext();
  const { setPopupId } = context;
  const id = idProp ?? context.popupId;
  // React 17 resolves generated ids in an effect, so they must be read live rather than captured
  // in a state initializer.
  const defaultListId = useBaseUiId();
  const [registeredListId, setListId] = React.useState<string | undefined>(undefined);
  const listId = registeredListId ?? defaultListId;
  const [registeredItems, registerItem] = useItemRegistry<symbol, FilterDropdownItemRegistration>();

  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const store = useRefWithInit(() => new Store<StoreState>({ visibleItemIds: null })).current;
  const hasAriaLabel = elementProps['aria-label'] || elementProps['aria-labelledby'];
  const ariaLabelledBy = hasAriaLabel ? elementProps['aria-labelledby'] : context.triggerId;

  const state: FilterDropdownPopupState = {
    open: context.open,
  };

  const matches = React.useMemo(() => {
    return context.filter ?? getContainsFilter({ locale: context.locale });
  }, [context.filter, context.locale]);

  const filter = React.useCallback(
    (nextValue: string, registeredItems: ReadonlyMap<symbol, FilterDropdownItemRegistration>) => {
      const query = nextValue.trim();
      if (query === '') {
        if (store.state.visibleItemIds !== null) {
          store.set('visibleItemIds', null);
        }
      } else {
        const nextIds = new Set<symbol>();

        registeredItems.forEach(({ getText, keywords }, id) => {
          const filterText = getText();
          // The filter runs against the label text and against each keyword.
          if (
            (filterText != null && matches(filterText, query)) ||
            keywords?.some((keyword) => matches(keyword, query))
          ) {
            nextIds.add(id);
          }
        });

        const currentIds = store.state.visibleItemIds;
        if (currentIds === null || !isSetEqual(currentIds, nextIds)) {
          store.set('visibleItemIds', nextIds);
        }
      }
    },
    [store, matches],
  );

  const popupContextValue: FilterDropdownPopupContext = React.useMemo(
    () => ({
      store,
      inputRef,
      listId,
      registerItem,
      setListId,
    }),
    [store, listId, registerItem],
  );

  // Filtering uses the registry snapshot published after all items in the commit register.
  // It also uses the committed value because consumers can reject a proposed value change
  // when controlled.
  useIsoLayoutEffect(() => {
    if (context.open) {
      filter(value, registeredItems);
    }
  }, [context.open, filter, value, registeredItems]);

  useIsoLayoutEffect(() => {
    setPopupId(id);
  }, [id, setPopupId]);

  const handlePopupRef = useStableCallback((element: HTMLDivElement | null) => {
    const previousElement = popupRef.current;
    popupRef.current = element;

    if (previousElement && previousElement !== element) {
      context.popupElements.delete(previousElement);
    }

    if (element) {
      context.popupElements.add(element);
    }
  });

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, handlePopupRef],
    props: [
      {
        id,
        role: 'dialog',
        'aria-labelledby': ariaLabelledBy,
        // Input owns virtual focus
        'aria-activedescendant': undefined,
        onMouseDown(event) {
          if (getTarget(event.nativeEvent) === event.currentTarget) {
            // Keep focus on the input when the popup's own background is pressed.
            event.preventDefault();
          }
        },
        onMouseMove(event) {
          // A closing popup must not re-capture focus during its exit transition.
          if (context.open && isEventFromCurrentPopup(event, context.popupElements)) {
            inputRef.current?.focus({ preventScroll: true });
          }
        },
        onFocus(event) {
          if (context.open && getTarget(event.nativeEvent) === event.currentTarget) {
            inputRef.current?.focus({ preventScroll: true });
          }
        },
      },
      elementProps,
    ],
    stateAttributesMapping,
  });

  return (
    <FilterDropdownPopupContext.Provider value={popupContextValue}>
      {element}
    </FilterDropdownPopupContext.Provider>
  );
});

function isEventFromCurrentPopup(
  event: React.SyntheticEvent<HTMLDivElement>,
  popupElements: WeakSet<EventTarget>,
) {
  const eventPopup = event.nativeEvent
    .composedPath()
    .find((eventTarget) => popupElements.has(eventTarget));

  return eventPopup === event.currentTarget;
}

function isSetEqual<T>(firstSet: ReadonlySet<T>, secondSet: ReadonlySet<T>) {
  if (firstSet === secondSet) {
    return true;
  }

  if (firstSet.size !== secondSet.size) {
    return false;
  }

  for (const item of firstSet) {
    if (!secondSet.has(item)) {
      return false;
    }
  }

  return true;
}

export interface FilterDropdownPopupState {
  /**
   * Whether the popup is open.
   */
  open: boolean;
}

export interface FilterDropdownPopupProps extends BaseUIComponentProps<
  'div',
  FilterDropdownPopupState
> {
  id: string | undefined;
}

export namespace FilterDropdownPopup {
  export type Props = FilterDropdownPopupProps;
  export type State = FilterDropdownPopupState;
}

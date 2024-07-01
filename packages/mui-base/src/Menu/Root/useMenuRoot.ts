'use client';
import * as React from 'react';
import {
  safePolygon,
  useClick,
  useDismiss,
  useFloatingRootContext,
  useHover,
  useInteractions,
  useListNavigation,
  useTypeahead,
} from '@floating-ui/react';
import { useControllableReducer } from '../../utils/useControllableReducer';
import { StateChangeCallback, StateComparers } from '../../utils/useControllableReducer.types';
import { MenuActionTypes, MenuReducerState, UseMenuRootParameters } from './useMenuRoot.types';
import { menuReducer } from './menuReducer';
import { IndexableMap } from '../../utils/IndexableMap';
import { areArraysEqual } from '../../utils/areArraysEqual';
import { ListActionTypes } from '../../useList';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';

const INITIAL_STATE: Omit<MenuReducerState, 'open' | 'settings'> = {
  highlightedValue: null,
  selectedValues: [],
  items: new IndexableMap(),
  triggerElement: null,
  positionerElement: null,
  popupId: null,
  hasNestedMenuOpen: false,
};

/**
 *
 * API:
 *
 * - [useMenuRoot API](https://mui.com/base-ui/api/use-menu-root/)
 */
export function useMenuRoot(parameters: UseMenuRootParameters) {
  const {
    defaultOpen,
    onOpenChange,
    onHighlightChange,
    open: openProp,
    parentState,
    orientation,
    direction,
  } = parameters;

  const lastActionType = React.useRef<string | null>(null);
  const isNested = parentState !== undefined;

  const handleHighlightChange = React.useCallback(
    (
      value: string | null,
      reason: string,
      event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null,
    ) => {
      onHighlightChange?.(value, reason, event);
    },
    [onHighlightChange],
  );

  const handleStateChange: StateChangeCallback<MenuReducerState> = React.useCallback(
    (event, field, value, reason) => {
      switch (field) {
        case 'open':
          onOpenChange?.(
            event as React.MouseEvent | React.KeyboardEvent | React.FocusEvent,
            value as boolean,
          );
          break;

        case 'highlightedValue':
          handleHighlightChange(
            value as string | null,
            reason,
            event as React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null,
          );
          break;

        default:
          break;
      }

      lastActionType.current = reason;
    },
    [onOpenChange, handleHighlightChange],
  );

  const controlledProps = React.useMemo(
    () => (openProp !== undefined ? { open: openProp } : {}),
    [openProp],
  );

  const initialState: MenuReducerState = {
    ...INITIAL_STATE,
    open: defaultOpen ?? false,
    settings: {
      disabledItemsFocusable: true,
      disableListWrap: false,
      focusManagement: 'DOM',
      orientation,
      direction,
      pageSize: 1,
      selectionMode: 'none',
    },
  };

  const stateComparers = React.useMemo(
    () =>
      ({
        selectedValues: (valuesArray1: string[], valuesArray2: string[]) =>
          areArraysEqual(valuesArray1, valuesArray2),
      }) as StateComparers<MenuReducerState>,
    [],
  );

  const [state, dispatch] = useControllableReducer({
    controlledProps,
    initialState,
    onStateChange: handleStateChange,
    reducer: menuReducer,
    componentName: 'MenuRoot',
    stateComparers,
  });

  React.useEffect(() => {
    if (parentState?.open === false) {
      dispatch({ type: MenuActionTypes.close, event: null });
    }
  }, [parentState?.open, dispatch]);

  const floatingRootContext = useFloatingRootContext({
    elements: {
      reference: state.triggerElement,
      floating: state.positionerElement,
    },
    open: state.open,
    onOpenChange: (isOpen: boolean, event: Event | undefined) => {
      if (isOpen) {
        dispatch({ type: MenuActionTypes.open, event: event ?? null });
      } else {
        dispatch({ type: MenuActionTypes.close, event: event ?? null });
      }
    },
  });

  const [hoverEnabled, setHoverEnabled] = React.useState(true);

  const hover = useHover(floatingRootContext, {
    enabled: hoverEnabled && isNested,
    handleClose: safePolygon({ blockPointerEvents: true }),
    delay: {
      open: 75,
    },
  });

  const click = useClick(floatingRootContext, {
    event: 'mousedown',
    toggle: !isNested,
    ignoreMouse: isNested,
  });

  const dismiss = useDismiss(floatingRootContext, { bubbles: true });

  const itemDomElements = React.useRef<(HTMLElement | null)[]>([]);
  const itemLabels = React.useRef<(string | null)[]>([]);
  const activeIndex =
    state.highlightedValue == null ? null : state.items.indexOf(state.highlightedValue);

  React.useEffect(() => {
    itemDomElements.current = state.items.mapValues((item) => item.ref.current);
    itemLabels.current = state.items.mapValues(
      (item) => item.valueAsString ?? item.ref.current?.textContent ?? null,
    );
  }, [state.items]);

  const listNavigation = useListNavigation(floatingRootContext, {
    listRef: itemDomElements,
    activeIndex,
    nested: isNested,
    loop: true,
    onNavigate: (index) => {
      if (index !== activeIndex) {
        dispatch({
          type: ListActionTypes.highlight,
          item: index == null ? null : state.items.keyAt(index) ?? null,
          event: null,
        });
      }
    },
  });

  const typeahead = useTypeahead(floatingRootContext, {
    listRef: itemLabels,
    activeIndex,
    resetMs: 350,
    onMatch: (index) => {
      if (state.open && index !== activeIndex) {
        dispatch({
          type: ListActionTypes.highlight,
          item: index == null ? null : state.items.keyAt(index) ?? null,
          event: null,
        });
      }
    },
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    hover,
    click,
    dismiss,
    listNavigation,
    typeahead,
  ]);

  const getTriggerProps = React.useCallback(
    (externalProps: GenericHTMLProps) =>
      getReferenceProps(
        mergeReactProps(externalProps, {
          onMouseEnter: () => {
            setHoverEnabled(true);
          },
        }),
      ),
    [getReferenceProps],
  );

  const getPositionerProps = React.useCallback(
    (externalProps: GenericHTMLProps) =>
      getFloatingProps(
        mergeReactProps(externalProps, {
          onMouseEnter: () => {
            setHoverEnabled(false);
          },
        }),
      ),
    [getFloatingProps],
  );

  return React.useMemo(
    () => ({
      state,
      dispatch,
      floatingRootContext,
      getTriggerProps,
      getPositionerProps,
      getItemProps,
    }),
    [state, dispatch, floatingRootContext, getTriggerProps, getPositionerProps, getItemProps],
  );
}

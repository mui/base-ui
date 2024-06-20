'use client';
import * as React from 'react';
import { useControllableReducer } from '../../utils/useControllableReducer';
import { StateChangeCallback, StateComparers } from '../../utils/useControllableReducer.types';
import { MenuActionTypes, MenuReducerState, UseMenuRootParameters } from './useMenuRoot.types';
import { menuReducer } from './menuReducer';
import { IndexableMap } from '../../utils/IndexableMap';
import { areArraysEqual } from '../../utils/areArraysEqual';
import { ListActionTypes } from '../../useList';

const INITIAL_STATE: Omit<MenuReducerState, 'open' | 'settings'> = {
  changeReason: null,
  highlightedValue: null,
  selectedValues: [],
  items: new IndexableMap(),
  listboxRef: { current: null },
  triggerElement: null,
  popupId: null,
};

/**
 *
 * Demos:
 *
 * - [Menu](https://mui.com/base-ui/react-menu/#hooks)
 *
 * API:
 *
 * - [useDropdown API](https://mui.com/base-ui/react-menu/hooks-api/#use-dropdown)
 */
export function useMenuRoot(parameters: UseMenuRootParameters = {}) {
  const {
    defaultOpen,
    getItemDomElement,
    onOpenChange,
    onHighlightChange,
    open: openProp,
  } = parameters;

  const lastActionType = React.useRef<string | null>(null);

  const handleHighlightChange = React.useCallback(
    (
      value: string | null,
      reason: string,
      event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent | null,
    ) => {
      onHighlightChange?.(value, reason, event);

      if (
        value != null &&
        (reason === ListActionTypes.itemClick ||
          reason === ListActionTypes.keyDown ||
          reason === ListActionTypes.textNavigation)
      ) {
        getItemDomElement?.(value)?.focus();
      }
    },
    [getItemDomElement, onHighlightChange],
  );

  const handleStateChange: StateChangeCallback<MenuReducerState> = React.useCallback(
    (event, field, value, reason) => {
      if (field === 'open') {
        onOpenChange?.(
          event as React.MouseEvent | React.KeyboardEvent | React.FocusEvent,
          value as boolean,
        );
      }

      switch (field) {
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
      orientation: 'vertical', // TODO: from parameters
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
    if (
      !state.open &&
      lastActionType.current !== null &&
      lastActionType.current !== MenuActionTypes.blur
    ) {
      state.triggerElement?.focus();
    }
  }, [state.open, state.triggerElement]);

  return React.useMemo(() => ({ state, dispatch }), [state, dispatch]);
}

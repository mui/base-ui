'use client';
import * as React from 'react';
import type { MenuRootContextValue } from './MenuRootContext';
import { useControllableReducer } from '../../utils/useControllableReducer';
import { StateChangeCallback } from '../../utils/useControllableReducer.types';
import { MenuActionTypes, MenuReducerState, UseMenuRootParameters } from './useMenuRoot.types';
import { menuReducer } from './menuReducer';
import { IndexableMap } from '../../utils/IndexableMap';

const INITIAL_STATE: Omit<MenuReducerState, 'open' | 'settings'> = {
  changeReason: null,
  highlightedValue: null,
  selectedValues: [],
  items: new IndexableMap(),
  listboxRef: { current: null },
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
  const { defaultOpen, onOpenChange, open: openProp } = parameters;
  const [popupId, setPopupId] = React.useState<string>('');
  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const lastActionType = React.useRef<string | null>(null);

  const handleStateChange: StateChangeCallback<MenuReducerState> = React.useCallback(
    (event, field, value, reason) => {
      if (field === 'open') {
        onOpenChange?.(
          event as React.MouseEvent | React.KeyboardEvent | React.FocusEvent,
          value as boolean,
        );
      }

      lastActionType.current = reason;
    },
    [onOpenChange],
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

  const [state, dispatch] = useControllableReducer({
    controlledProps,
    initialState,
    onStateChange: handleStateChange,
    reducer: menuReducer,
    componentName: 'MenuRoot',
  });

  React.useEffect(() => {
    if (
      !state.open &&
      lastActionType.current !== null &&
      lastActionType.current !== MenuActionTypes.blur
    ) {
      triggerElement?.focus();
    }
  }, [state.open, triggerElement]);

  const contextValue: MenuRootContextValue = {
    state,
    dispatch,
    popupId,
    registerPopup: setPopupId,
    registerTrigger: setTriggerElement,
    triggerElement,
  };

  return {
    contextValue,
    open: state.open,
  };
}

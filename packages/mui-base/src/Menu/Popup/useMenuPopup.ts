'use client';
import * as React from 'react';
import {
  unstable_useForkRef as useForkRef,
  unstable_useId as useId,
  unstable_useEnhancedEffect as useEnhancedEffect,
} from '@mui/utils';
import { UseMenuPopupParameters, UseMenuPopupReturnValue } from './useMenuPopup.types';
import { MenuRootContext } from '../Root/MenuRootContext';
import { ListActionTypes, useList } from '../../useList';
import { MenuItemMetadata } from '../Item/useMenuItem.types';
import { MenuActionTypes } from '../Root/useMenuRoot.types';
import { EventHandlers } from '../../utils/types';
import { useCompoundParent } from '../../useCompound';
import { MuiCancellableEvent } from '../../utils/MuiCancellableEvent';
import { combineHooksSlotProps } from '../../legacy/utils/combineHooksSlotProps';
import { extractEventHandlers } from '../../utils/extractEventHandlers';

const EMPTY_ARRAY: string[] = [];

export function useMenuPopup(parameters: UseMenuPopupParameters = {}): UseMenuPopupReturnValue {
  const { listboxRef: listboxRefProp, id: idParam, autoFocus = true } = parameters;

  const rootRef = React.useRef<HTMLElement>(null);
  const handleRef = useForkRef(rootRef, listboxRefProp);

  const listboxId = useId(idParam) ?? '';

  const menuRootContext = React.useContext(MenuRootContext);
  if (menuRootContext == null) {
    throw new Error(
      `Base UI: MenuPopup is missing the parent context value. Make sure the component is inside a MenuRoot.`,
    );
  }

  const {
    state: { open, changeReason, highlightedValue },
    dispatch,
    triggerElement,
    registerPopup,
  } = menuRootContext;

  // store the initial open state to prevent focus stealing
  // (the first menu items gets focued only when the menu is opened by the user)
  const isInitiallyOpen = React.useRef(open);

  const { subitems, registerItem } = useCompoundParent<string, MenuItemMetadata>();

  const { getRootProps: getListRootProps, rootRef: mergedListRef } = useList({
    dispatch,
    highlightedValue,
    selectedValues: EMPTY_ARRAY,
    focusManagement: 'DOM',
    rootRef: handleRef,
  });

  useEnhancedEffect(() => {
    registerPopup(listboxId);
  }, [listboxId, registerPopup]);

  useEnhancedEffect(() => {
    if (
      open &&
      changeReason?.type === 'keydown' &&
      (changeReason as React.KeyboardEvent).key === 'ArrowUp'
    ) {
      dispatch({
        type: ListActionTypes.highlightLast,
        event: changeReason as React.KeyboardEvent,
      });
    }
  }, [open, changeReason, dispatch]);

  React.useEffect(() => {
    if (open && autoFocus && highlightedValue && !isInitiallyOpen.current) {
      subitems.get(highlightedValue)?.ref?.current?.focus();
    }
  }, [open, autoFocus, highlightedValue, subitems]);

  React.useEffect(() => {
    // set focus to the highlighted item (but prevent stealing focus from other elements on the page)
    if (rootRef.current?.contains(document.activeElement) && highlightedValue !== null) {
      subitems?.get(highlightedValue)?.ref.current?.focus();
    }
  }, [highlightedValue, subitems]);

  const createHandleBlur =
    (otherHandlers: EventHandlers) => (event: React.FocusEvent & MuiCancellableEvent) => {
      otherHandlers.onBlur?.(event);
      if (event.defaultMuiPrevented) {
        return;
      }

      if (
        rootRef.current?.contains(event.relatedTarget as HTMLElement) ||
        event.relatedTarget === triggerElement
      ) {
        return;
      }

      dispatch({
        type: MenuActionTypes.blur,
        event,
      });
    };

  const createHandleKeyDown =
    (otherHandlers: EventHandlers) => (event: React.KeyboardEvent & MuiCancellableEvent) => {
      otherHandlers.onKeyDown?.(event);
      if (event.defaultMuiPrevented) {
        return;
      }

      if (event.key === 'Escape') {
        dispatch({
          type: MenuActionTypes.escapeKeyDown,
          event,
        });
      }
    };

  const getOwnListboxHandlers = (otherHandlers: EventHandlers = {}) => ({
    onBlur: createHandleBlur(otherHandlers),
    onKeyDown: createHandleKeyDown(otherHandlers),
  });

  const getListboxProps = <ExternalProps extends Record<string, unknown>>(
    externalProps: ExternalProps = {} as ExternalProps,
  ) => {
    const getCombinedRootProps = combineHooksSlotProps(getOwnListboxHandlers, getListRootProps);
    const externalEventHandlers = extractEventHandlers(externalProps);
    return {
      ...externalProps,
      ...externalEventHandlers,
      ...getCombinedRootProps(externalEventHandlers),
      id: listboxId,
      role: 'menu',
    };
  };

  return {
    dispatch,
    registerItem,
    getListboxProps,
    listboxRef: mergedListRef,
  };
}

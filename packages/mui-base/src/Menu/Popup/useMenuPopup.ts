'use client';
import * as React from 'react';
import {
  unstable_useForkRef as useForkRef,
  unstable_useId as useId,
  unstable_useEnhancedEffect as useEnhancedEffect,
} from '@mui/utils';
import { UseMenuPopupParameters, UseMenuPopupReturnValue } from './useMenuPopup.types';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { ListActionTypes, useList } from '../../useList';
import { MenuActionTypes } from '../Root/useMenuRoot.types';
import { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';

const EMPTY_ARRAY: string[] = [];

export function useMenuPopup(parameters: UseMenuPopupParameters): UseMenuPopupReturnValue {
  const { listboxRef: listboxRefProp, id: idParam, autoFocus = true, subitems } = parameters;

  const rootRef = React.useRef<HTMLElement>(null);
  const handleRef = useForkRef(rootRef, listboxRefProp);

  const id = useId(idParam) ?? '';

  const {
    state: { open, changeReason, highlightedValue },
    dispatch,
    triggerElement,
    registerPopup,
  } = useMenuRootContext();

  // store the initial open state to prevent focus stealing
  // (the first menu items gets focued only when the menu is opened by the user)
  const isInitiallyOpen = React.useRef(open);

  const {
    getRootProps: getListRootProps,
    rootRef: mergedListRef,
    getItemState,
  } = useList({
    dispatch,
    highlightedValue,
    selectedValues: EMPTY_ARRAY,
    focusManagement: 'DOM',
    rootRef: handleRef,
    items: subitems,
  });

  useEnhancedEffect(() => {
    registerPopup(id);
  }, [id, registerPopup]);

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

  const getListboxProps = (externalProps?: GenericHTMLProps) => {
    return mergeReactProps(
      externalProps,
      {
        onBlur: (event: React.FocusEvent) => {
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
        },
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === 'Escape') {
            dispatch({
              type: MenuActionTypes.escapeKeyDown,
              event,
            });
          }
        },
        id,
        role: 'menu',
      },
      getListRootProps(),
    );
  };

  return {
    getItemState,
    getListboxProps,
    listboxRef: mergedListRef,
  };
}

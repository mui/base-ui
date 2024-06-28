'use client';
import * as React from 'react';
import {
  unstable_useForkRef as useForkRef,
  unstable_useId as useId,
  unstable_useEnhancedEffect as useEnhancedEffect,
} from '@mui/utils';
import { UseMenuPopupParameters, UseMenuPopupReturnValue } from './useMenuPopup.types';
import { useList } from '../../useList';
import { MenuActionTypes } from '../Root/useMenuRoot.types';
import { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';

const EMPTY_ARRAY: string[] = [];
/**
 *
 * API:
 *
 * - [useMenuPopup API](https://mui.com/base-ui/api/use-menu-popup/)
 */
export function useMenuPopup(parameters: UseMenuPopupParameters): UseMenuPopupReturnValue {
  const {
    id: idParam,
    autoFocus = true,
    state,
    dispatch,
    childItems,
    rootRef: externalRef,
    isNested,
  } = parameters;

  const rootRef = React.useRef<HTMLElement>(null);
  const handleRef = useForkRef(rootRef, state.listboxRef, externalRef);

  const id = useId(idParam) ?? '';

  const {
    open,
    highlightedValue,
    items: subitems,
    settings: { orientation, direction },
  } = state;

  // store the initial open state to prevent focus stealing
  // (the first menu items gets focued only when the menu is opened by the user)
  const isInitiallyOpen = React.useRef(open);

  const { getRootProps: getListRootProps, rootRef: mergedListRef } = useList({
    dispatch,
    highlightedValue,
    selectedValues: EMPTY_ARRAY,
    focusManagement: 'DOM',
    rootRef: handleRef,
    items: childItems,
    orientation,
    direction,
    isNested,
  });

  useEnhancedEffect(() => {
    dispatch({
      type: MenuActionTypes.registerPopup,
      popupId: id,
    });
  }, [id, dispatch]);

  React.useEffect(() => {
    if (open && autoFocus && highlightedValue && !isInitiallyOpen.current) {
      subitems.get(highlightedValue)?.ref?.current?.focus();
    }
  }, [open, autoFocus, highlightedValue, subitems]);

  const getRootProps = (externalProps?: GenericHTMLProps) => {
    return mergeReactProps(
      externalProps,
      {
        id,
        role: 'menu',
        'aria-hidden': !open || undefined,
      },
      getListRootProps(),
    );
  };

  return {
    getRootProps,
    rootRef: mergedListRef,
  };
}

'use client';
import * as React from 'react';
import {
  unstable_useId as useId,
  unstable_useEnhancedEffect as useEnhancedEffect,
} from '@mui/utils';
import { UseMenuPopupParameters, UseMenuPopupReturnValue } from './useMenuPopup.types';
import { MenuActionTypes } from '../Root/useMenuRoot.types';
import { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useCompoundParent } from '../../useCompound';
import { IndexableMap } from '../../utils/IndexableMap';
import { ListActionTypes, ListItemMetadata } from '../../useList';

/**
 *
 * API:
 *
 * - [useMenuPopup API](https://mui.com/base-ui/api/use-menu-popup/)
 */
export function useMenuPopup(parameters: UseMenuPopupParameters): UseMenuPopupReturnValue {
  const { id: idParam, state, dispatch } = parameters;

  const id = useId(idParam) ?? '';

  const { open } = state;

  const { context: compoundParentContext, subitems } = useCompoundParent<
    string,
    ListItemMetadata
  >();

  useEnhancedEffect(() => {
    dispatch({
      type: MenuActionTypes.registerPopup,
      popupId: id,
    });
  }, [id, dispatch]);

  const previousItems = React.useRef<IndexableMap<string, ListItemMetadata>>(new IndexableMap());

  React.useEffect(() => {
    // Whenever the `items` object changes, we need to determine if the actual items changed.
    // If they did, we need to dispatch an `itemsChange` action, so the selected/highlighted state is updated.
    if (IndexableMap.areEqual(previousItems.current, subitems)) {
      return;
    }

    dispatch({
      type: ListActionTypes.itemsChange,
      event: null,
      items: subitems,
    });

    previousItems.current = subitems;
  }, [subitems, dispatch]);

  const getRootProps = (externalProps?: GenericHTMLProps) => {
    return mergeReactProps(externalProps, {
      id,
      role: 'menu',
      'aria-hidden': !open || undefined,
    });
  };

  return {
    getRootProps,
    compoundParentContext,
  };
}

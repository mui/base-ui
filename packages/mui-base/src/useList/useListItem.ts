'use client';
import * as React from 'react';
import { GenericHTMLProps } from '../utils/types';
import { UseListItemParameters, UseListItemReturnValue } from './useListItem.types';
import { ListActionTypes } from './listActions.types';
import { mergeReactProps } from '../utils/mergeReactProps';

/**
 * Contains the logic for an item of a list-like component (for example Select, Menu, etc.).
 * It handles the item's mouse events and tab index.
 *
 * @template ItemValue The type of the item's value. This should be consistent with the type of useList's `items` parameter.
 * @ignore - internal hook.
 */
export function useListItem<ItemValue>(
  parameters: UseListItemParameters<ItemValue>,
): UseListItemReturnValue {
  const {
    handlePointerOverEvents = false,
    item,
    dispatch,
    highlighted,
    selected,
    focusable,
  } = parameters;

  let tabIndex: number | undefined;
  if (focusable) {
    tabIndex = highlighted ? 0 : -1;
  }

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps) => {
      return mergeReactProps(externalProps, {
        onClick: (event: React.MouseEvent) => {
          if (process.env.NODE_ENV !== 'production') {
            if (item === undefined) {
              throw new Error(
                [
                  'MUI: The `item` provided to useListItem() is undefined.',
                  'This should happen only during server-side rendering under React 17.',
                ].join('\n'),
              );
            }
          }

          dispatch({
            type: ListActionTypes.itemClick,
            item: item!,
            event,
          });
        },
        onPointerOver: handlePointerOverEvents
          ? (event: React.PointerEvent) => {
              if (process.env.NODE_ENV !== 'production') {
                if (item === undefined) {
                  throw new Error(
                    [
                      'MUI: The `item` provided to useListItem() is undefined.',
                      'This should happen only during server-side rendering under React 17.',
                    ].join('\n'),
                  );
                }
              }

              dispatch({
                type: ListActionTypes.itemHover,
                item: item!,
                event,
              });
            }
          : undefined,
        tabIndex,
      });
    },
    [dispatch, handlePointerOverEvents, item, tabIndex],
  );

  return {
    getRootProps,
    highlighted,
    selected,
  };
}

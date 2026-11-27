'use client';
import * as React from 'react';
import { NOOP } from '@base-ui/utils/empty';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useButton } from '../../internals/use-button';
import { useRenderElement } from '../../internals/useRenderElement';
import { mergeProps } from '../../merge-props';
import type { HTMLProps } from '../../internals/types';
import { useMenuRootContext } from '../root/MenuRootContext';
import type { MenuStore } from '../store/MenuStore';
import { itemMapping } from '../utils/stateAttributesMapping';
import { useMenuItemCommonProps } from './useMenuItemCommonProps';

export const REGULAR_ITEM = {
  type: 'regular-item' as const,
};

export function useMenuItem(params: UseMenuItemParameters): UseMenuItemReturnValue {
  const {
    closeOnClick,
    disabled,
    highlighted,
    id,
    store,
    typingRef = store.context.typingRef,
    nativeButton,
    itemMetadata,
    nodeId,
  } = params;

  const itemRef = React.useRef<HTMLElement | null>(null);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton,
    composite: true,
  });

  const commonProps = useMenuItemCommonProps({
    closeOnClick,
    highlighted,
    id,
    nodeId,
    store,
    typingRef,
    itemRef,
    itemMetadata,
  });

  const getItemProps = React.useCallback(
    (externalProps?: HTMLProps): HTMLProps => {
      return mergeProps<'div'>(
        commonProps,
        {
          onMouseEnter(event) {
            if (itemMetadata.type !== 'submenu-trigger') {
              return;
            }

            itemMetadata.setActive(event.nativeEvent);
          },
        },
        externalProps,
        getButtonProps,
      );
    },
    [commonProps, getButtonProps, itemMetadata],
  );

  const mergedRef = useMergedRefs(itemRef, buttonRef);

  return React.useMemo(
    () => ({
      getItemProps,
      itemRef: mergedRef,
    }),
    [getItemProps, mergedRef],
  );
}

export function useRegularMenuItem(
  label: string | undefined,
  idProp: string | undefined,
  disabledProp: boolean,
  closeOnClick: boolean,
  nativeButton: boolean,
  extraDisabled = false,
) {
  const { store } = useMenuRootContext();

  const listItem = useCompositeListItem({ guess: true, label });
  const id = useBaseUiId(idProp);

  const rootDisabled = store.useState('disabled');
  const highlighted = store.useState('isActive', listItem.index);
  const nodeId = store.useState('floatingNodeId');
  const itemProps = store.useState('itemProps');

  const disabled = disabledProp || extraDisabled || rootDisabled;

  const { getItemProps, itemRef } = useMenuItem({
    closeOnClick,
    disabled,
    highlighted,
    id,
    store,
    nativeButton,
    nodeId,
    itemMetadata: REGULAR_ITEM,
  });

  return {
    disabled,
    highlighted,
    itemProps: itemProps as HTMLProps,
    getItemProps,
    itemRef: itemRef as React.Ref<HTMLElement>,
    listItemRef: listItem.ref as React.Ref<HTMLElement>,
  };
}

export function useSelectableMenuItem(
  componentProps: Record<string, any>,
  forwardedRef: React.ForwardedRef<HTMLElement>,
  checked: boolean,
  role: 'menuitemcheckbox' | 'menuitemradio',
  Context: React.Context<any>,
  onPress: (details: any) => void,
  extraDisabled = false,
) {
  const {
    render,
    className,
    id: idProp,
    label,
    nativeButton = false,
    disabled: disabledProp = false,
    closeOnClick = false,
    checked: checkedProp,
    onCheckedChange,
    value,
    style,
    ...elementProps
  } = componentProps;

  const { disabled, highlighted, itemProps, getItemProps, itemRef, listItemRef } =
    useRegularMenuItem(label, idProp, disabledProp, closeOnClick, nativeButton, extraDisabled);

  const state = React.useMemo(
    () => ({
      disabled,
      highlighted,
      checked,
    }),
    [disabled, highlighted, checked],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    stateAttributesMapping: itemMapping,
    props: [
      itemProps,
      {
        role,
        'aria-checked': checked,
        onClick(event: React.MouseEvent) {
          onPress(
            createChangeEventDetails(REASONS.itemPress, event.nativeEvent, undefined, {
              preventUnmountOnClose: NOOP,
            }),
          );
        },
      },
      elementProps,
      getItemProps,
    ],
    ref: [itemRef, forwardedRef, listItemRef],
  });

  return React.createElement(Context.Provider, { value: state }, element);
}

export interface UseMenuItemParameters {
  /**
   * Whether to close the menu when the item is clicked.
   */
  closeOnClick: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Determines if the menu item is highlighted.
   */
  highlighted: boolean;
  /**
   * The id of the menu item.
   */
  id: string | undefined;
  /**
   * Whether the component renders a native `<button>` element when replacing it
   * via the `render` prop.
   * Set to `false` if the rendered element is not a button (for example, `<div>`).
   * @default false
   */
  nativeButton: boolean;
  /**
   * Additional data specific to the item type.
   */
  itemMetadata: UseMenuItemMetadata;
  /**
   * The node id of the menu positioner.
   */
  nodeId: string | undefined;
  /**
   * The menu store.
   */
  store: MenuStore<any>;
  /**
   * Whether a typeahead session is in progress.
   * @default store.context.typingRef
   */
  typingRef?: React.RefObject<boolean> | undefined;
}

export type UseMenuItemMetadata =
  | typeof REGULAR_ITEM
  | {
      type: 'submenu-trigger';
      setActive: (event: MouseEvent) => void;
    };

export interface UseMenuItemReturnValue {
  /**
   * Resolver for the root slot's props.
   * @param externalProps event handlers for the root slot
   * @returns props that should be spread on the root slot
   */
  getItemProps: (externalProps?: HTMLProps) => HTMLProps;
  /**
   * The ref to the component's root DOM element.
   */
  itemRef: React.RefCallback<HTMLElement> | null;
}

export interface UseMenuItemState {}

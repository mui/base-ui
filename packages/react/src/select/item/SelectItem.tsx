'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useLatestRef } from '@base-ui-components/utils/useLatestRef';
import { isMouseWithinBounds } from '@base-ui-components/utils/isMouseWithinBounds';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { useStore } from '@base-ui-components/utils/store';
import { useSelectRootContext } from '../root/SelectRootContext';
import {
  useCompositeListItem,
  IndexGuessBehavior,
} from '../../composite/list/useCompositeListItem';
import type { BaseUIComponentProps, HTMLProps, NonNativeButtonProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { SelectItemContext } from './SelectItemContext';
import { selectors } from '../store';
import { useButton } from '../../use-button';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { compareItemEquality, itemIncludes, removeItem } from '../../utils/itemEquality';

/**
 * An individual option in the select popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectItem = React.memo(
  React.forwardRef(function SelectItem(
    componentProps: SelectItem.Props,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {
      render,
      className,
      value = null,
      label,
      disabled = false,
      nativeButton = false,
      ...elementProps
    } = componentProps;

    const textRef = React.useRef<HTMLElement | null>(null);
    const listItem = useCompositeListItem({
      label,
      textRef,
      indexGuessBehavior: IndexGuessBehavior.GuessFromOrder,
    });

    const {
      store,
      getItemProps,
      setOpen,
      setValue,
      selectionRef,
      typingRef,
      valuesRef,
      registerItemIndex,
      keyboardActiveRef,
      multiple,
    } = useSelectRootContext();

    const highlightTimeout = useTimeout();

    const highlighted = useStore(store, selectors.isActive, listItem.index);
    const selected = useStore(store, selectors.isSelected, listItem.index, value);
    const rootValue = useStore(store, selectors.value);
    const selectedByFocus = useStore(store, selectors.isSelectedByFocus, listItem.index);
    const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);

    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const indexRef = useLatestRef(listItem.index);

    const hasRegistered = listItem.index !== -1;

    useIsoLayoutEffect(() => {
      if (!hasRegistered) {
        return undefined;
      }

      const values = valuesRef.current;
      values[listItem.index] = value;

      return () => {
        delete values[listItem.index];
      };
    }, [hasRegistered, listItem.index, value, valuesRef]);

    useIsoLayoutEffect(() => {
      if (hasRegistered) {
        if (multiple) {
          const isValueSelected =
            Array.isArray(rootValue) && itemIncludes(rootValue, value, isItemEqualToValue);
          if (isValueSelected) {
            registerItemIndex(listItem.index);
          }
        } else if (compareItemEquality(rootValue, value, isItemEqualToValue)) {
          registerItemIndex(listItem.index);
        }
      }
    }, [
      hasRegistered,
      listItem.index,
      registerItemIndex,
      value,
      rootValue,
      multiple,
      isItemEqualToValue,
    ]);

    const state: SelectItem.State = React.useMemo(
      () => ({
        disabled,
        selected,
        highlighted,
      }),
      [disabled, selected, highlighted],
    );

    const rootProps = getItemProps({ active: highlighted, selected });
    // With our custom `focusItemOnHover` implementation, this interferes with the logic and can
    // cause the index state to be stuck when leaving the select popup.
    delete rootProps.onFocus;
    delete rootProps.id;

    const lastKeyRef = React.useRef<string | null>(null);
    const pointerTypeRef = React.useRef<'mouse' | 'touch' | 'pen'>('mouse');
    const didPointerDownRef = React.useRef(false);

    const { getButtonProps, buttonRef } = useButton({
      disabled,
      focusableWhenDisabled: true,
      native: nativeButton,
    });

    function commitSelection(event: MouseEvent) {
      if (multiple) {
        const currentValue = Array.isArray(rootValue) ? rootValue : [];
        const nextValue = selected
          ? removeItem(currentValue, value, isItemEqualToValue)
          : [...currentValue, value];
        setValue(nextValue, createChangeEventDetails('item-press', event));
      } else {
        setValue(value, createChangeEventDetails('item-press', event));
        setOpen(false, createChangeEventDetails('item-press', event));
      }
    }

    const defaultProps: HTMLProps = {
      role: 'option',
      'aria-selected': selected,
      'aria-disabled': disabled || undefined,
      tabIndex: highlighted ? 0 : -1,
      onFocus() {
        store.set('activeIndex', indexRef.current);
      },
      onMouseEnter() {
        if (!keyboardActiveRef.current && store.state.selectedIndex === null) {
          store.set('activeIndex', indexRef.current);
        }
      },
      onMouseMove() {
        store.set('activeIndex', indexRef.current);
      },
      onMouseLeave(event) {
        if (keyboardActiveRef.current || isMouseWithinBounds(event)) {
          return;
        }

        highlightTimeout.start(0, () => {
          if (store.state.activeIndex === indexRef.current) {
            store.set('activeIndex', null);
          }
        });
      },
      onTouchStart() {
        selectionRef.current = {
          allowSelectedMouseUp: false,
          allowUnselectedMouseUp: false,
        };
      },
      onKeyDown(event) {
        lastKeyRef.current = event.key;
        store.set('activeIndex', indexRef.current);
      },
      onClick(event) {
        didPointerDownRef.current = false;

        // Prevent double commit on {Enter}
        if (event.type === 'keydown' && lastKeyRef.current === null) {
          return;
        }

        if (
          disabled ||
          (lastKeyRef.current === ' ' && typingRef.current) ||
          (pointerTypeRef.current !== 'touch' && !highlighted)
        ) {
          return;
        }

        lastKeyRef.current = null;
        commitSelection(event.nativeEvent);
      },
      onPointerEnter(event) {
        pointerTypeRef.current = event.pointerType;
      },
      onPointerDown(event) {
        pointerTypeRef.current = event.pointerType;
        didPointerDownRef.current = true;
      },
      onMouseUp(event) {
        if (disabled) {
          return;
        }

        if (didPointerDownRef.current) {
          didPointerDownRef.current = false;
          return;
        }

        const disallowSelectedMouseUp = !selectionRef.current.allowSelectedMouseUp && selected;
        const disallowUnselectedMouseUp = !selectionRef.current.allowUnselectedMouseUp && !selected;

        if (
          disallowSelectedMouseUp ||
          disallowUnselectedMouseUp ||
          (pointerTypeRef.current !== 'touch' && !highlighted)
        ) {
          return;
        }

        commitSelection(event.nativeEvent);
      },
    };

    const element = useRenderElement('div', componentProps, {
      ref: [buttonRef, forwardedRef, listItem.ref, itemRef],
      state,
      props: [rootProps, defaultProps, elementProps, getButtonProps],
    });

    const contextValue: SelectItemContext = React.useMemo(
      () => ({
        selected,
        indexRef,
        textRef,
        selectedByFocus,
      }),
      [selected, indexRef, textRef, selectedByFocus],
    );

    return <SelectItemContext.Provider value={contextValue}>{element}</SelectItemContext.Provider>;
  }),
);

export interface SelectItemState {
  /**
   * Whether the item should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the item is selected.
   */
  selected: boolean;
  /**
   * Whether the item is highlighted.
   */
  highlighted: boolean;
}

export interface SelectItemProps
  extends NonNativeButtonProps,
    Omit<BaseUIComponentProps<'div', SelectItem.State>, 'id'> {
  children?: React.ReactNode;
  /**
   * A unique value that identifies this select item.
   * @default null
   */
  value?: any;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
  /**
   * Specifies the text label to use when the item is matched during keyboard text navigation.
   *
   * Defaults to the item text content if not provided.
   */
  label?: string;
}

export namespace SelectItem {
  export type State = SelectItemState;
  export type Props = SelectItemProps;
}

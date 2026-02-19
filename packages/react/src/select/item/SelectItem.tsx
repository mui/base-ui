'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { isMouseWithinBounds } from '@base-ui/utils/isMouseWithinBounds';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useStore } from '@base-ui/utils/store';
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
import { REASONS } from '../../utils/reasons';
import { compareItemEquality, removeItem } from '../../utils/itemEquality';

/**
 * An individual option in the select popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectItem = React.memo(
  React.forwardRef(function SelectItem(
    componentProps: SelectItem.Props,
    forwardedRef: React.ForwardedRef<HTMLElement>,
  ) {
    const {
      render,
      className,
      value: itemValue = null,
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
      keyboardActiveRef,
      multiple,
      highlightItemOnHover,
    } = useSelectRootContext();

    const highlightTimeout = useTimeout();

    const highlighted = useStore(store, selectors.isActive, listItem.index);
    const selected = useStore(store, selectors.isSelected, listItem.index, itemValue);
    const selectedByFocus = useStore(store, selectors.isSelectedByFocus, listItem.index);
    const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);

    const index = listItem.index;
    const hasRegistered = index !== -1;

    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const indexRef = useValueAsRef(index);

    useIsoLayoutEffect(() => {
      if (!hasRegistered) {
        return undefined;
      }

      const values = valuesRef.current;
      values[index] = itemValue;

      return () => {
        delete values[index];
      };
    }, [hasRegistered, index, itemValue, valuesRef]);

    useIsoLayoutEffect(() => {
      if (!hasRegistered) {
        return undefined;
      }

      const selectedValue = store.state.value;

      let selectedCandidate = selectedValue;
      if (multiple && Array.isArray(selectedValue) && selectedValue.length > 0) {
        selectedCandidate = selectedValue[selectedValue.length - 1];
      }

      if (
        selectedCandidate !== undefined &&
        compareItemEquality(itemValue, selectedCandidate, isItemEqualToValue)
      ) {
        store.set('selectedIndex', index);
      }
      return undefined;
    }, [hasRegistered, index, multiple, isItemEqualToValue, store, itemValue]);

    const state: SelectItem.State = {
      disabled,
      selected,
      highlighted,
    };

    const rootProps = getItemProps({ active: highlighted, selected });
    // With our custom `focusItemOnHover` implementation, this interferes with the logic and can
    // cause the index state to be stuck when leaving the select popup.
    rootProps.onFocus = undefined;
    rootProps.id = undefined;

    const lastKeyRef = React.useRef<string | null>(null);
    const pointerTypeRef = React.useRef<'mouse' | 'touch' | 'pen'>('mouse');
    const didPointerDownRef = React.useRef(false);

    const { getButtonProps, buttonRef } = useButton({
      disabled,
      focusableWhenDisabled: true,
      native: nativeButton,
    });

    function commitSelection(event: MouseEvent) {
      const selectedValue = store.state.value;
      if (multiple) {
        const currentValue = Array.isArray(selectedValue) ? selectedValue : [];
        const nextValue = selected
          ? removeItem(currentValue, itemValue, isItemEqualToValue)
          : [...currentValue, itemValue];
        setValue(nextValue, createChangeEventDetails(REASONS.itemPress, event));
      } else {
        setValue(itemValue, createChangeEventDetails(REASONS.itemPress, event));
        setOpen(false, createChangeEventDetails(REASONS.itemPress, event));
      }
    }

    const defaultProps: HTMLProps = {
      role: 'option',
      'aria-selected': selected,
      tabIndex: highlighted ? 0 : -1,
      onFocus() {
        store.set('activeIndex', index);
      },
      onMouseEnter() {
        if (
          !keyboardActiveRef.current &&
          store.state.selectedIndex === null &&
          highlightItemOnHover
        ) {
          store.set('activeIndex', index);
        }
      },
      onMouseMove() {
        if (highlightItemOnHover) {
          store.set('activeIndex', index);
        }
      },
      onMouseLeave(event) {
        if (!highlightItemOnHover || keyboardActiveRef.current || isMouseWithinBounds(event)) {
          return;
        }

        highlightTimeout.start(0, () => {
          if (store.state.activeIndex === index) {
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
        store.set('activeIndex', index);
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
      onMouseUp() {
        if (disabled) {
          return;
        }

        // Regular click (pointerdown on this element) if didPointerDownRef is set, otherwise drag-to-select
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

        itemRef.current?.click();
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
        hasRegistered,
      }),
      [selected, indexRef, textRef, selectedByFocus, hasRegistered],
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
  extends NonNativeButtonProps, Omit<BaseUIComponentProps<'div', SelectItem.State>, 'id'> {
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
  disabled?: boolean | undefined;
  /**
   * Specifies the text label to use when the item is matched during keyboard text navigation.
   *
   * Defaults to the item text content if not provided.
   */
  label?: string | undefined;
}

export namespace SelectItem {
  export type State = SelectItemState;
  export type Props = SelectItemProps;
}

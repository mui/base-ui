'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStore } from '@base-ui/utils/store';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import type {
  BaseUIComponentProps,
  BaseUIEvent,
  HTMLProps,
  NonNativeButtonProps,
} from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { SelectItemContext } from './SelectItemContext';
import { selectors, suffixId, type SelectItemMetadata } from '../store';
import { useButton } from '../../internals/use-button';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { removeItem } from '../../internals/itemEquality';
import { isVirtualClick } from '../../floating-ui-react/utils/event';

const SELECT_ITEM_ROLE = 'option';

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
      style,
      value: itemValue = null,
      label,
      disabled: disabledProp = false,
      nativeButton = false,
      ...elementProps
    } = componentProps;

    const registrationId = useRefWithInit(() => Symbol('select-item')).current;
    const textElementRef = React.useRef<HTMLElement | null>(null);
    const itemRef = React.useRef<HTMLElement | null>(null);
    const itemMetadata: SelectItemMetadata = React.useMemo(
      () => ({
        registrationId,
        getValue: () => itemValue,
        getLabel: () =>
          label ?? textElementRef.current?.textContent ?? itemRef.current?.textContent ?? undefined,
        getTextElement: () => textElementRef.current,
      }),
      [registrationId, itemValue, label],
    );
    const listItem = useCompositeListItem({
      metadata: itemMetadata,
      guess: true,
      label,
      textRef: textElementRef,
    });

    const {
      store,
      id: rootId,
      itemProps,
      setOpen,
      setValue,
      selectionRef,
      typingRef,
      multiple,
      virtualFocus,
      disabled: selectDisabled,
      readOnly,
    } = useSelectRootContext();

    const disabled = selectDisabled || disabledProp;
    const highlighted = useStore(store, selectors.isActive, listItem.index);
    const open = useStore(store, selectors.open);
    const selected = useStore(store, selectors.isSelected, itemValue);
    const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);

    const index = listItem.index;

    const id = suffixId(rootId, index);

    const pointerTypeRef = React.useRef<'mouse' | 'touch' | 'pen'>('mouse');
    const allowMouseSelectionRef = React.useRef(false);

    const { getButtonProps, buttonRef } = useButton({
      disabled,
      focusableWhenDisabled: true,
      native: nativeButton,
      composite: true,
    });

    const state: SelectItemState = {
      disabled,
      selected,
      highlighted,
    };

    function commitSelection(event: MouseEvent | KeyboardEvent | PointerEvent) {
      // A forced-open select (`open`/`defaultOpen`) can still receive item activations even
      // when the root is disabled or read-only, so guard the commit here too.
      if (selectDisabled || readOnly) {
        return;
      }

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

    function resetDragMovement() {
      selectionRef.current.dragY = 0;
    }

    // `-1` rather than omitting it, which leaves natively focusable items in the tab order.
    let rovingTabIndex = -1;
    if (!virtualFocus && open && highlighted) {
      rovingTabIndex = 0;
    }

    const defaultProps: HTMLProps = {
      id,
      role: SELECT_ITEM_ROLE,
      'aria-selected': selected,
      tabIndex: rovingTabIndex,
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent>) {
        store.set('activeIndex', index);

        if (event.key === ' ' && typingRef.current) {
          // `useButton` skips Space activation for `role="option"` items when the keydown
          // is `defaultPrevented`, keeping typeahead spaces from committing a selection.
          event.preventDefault();
        }
      },
      onClick(event) {
        const isMouseClick = pointerTypeRef.current !== 'touch';
        const clickPointerType = (event.nativeEvent as PointerEvent).pointerType;
        const isVirtualMouseClick =
          isMouseClick &&
          isVirtualClick(event.nativeEvent) &&
          // Generic no-pointer `detail === 0` clicks stay tied to highlight state. Virtual
          // clicks that carry browser pointer data, including an empty string from assistive
          // technology, can activate unhighlighted items.
          (clickPointerType !== undefined || highlighted);
        // With alignItemWithTrigger, opening can place an item under the cursor. Real mouse
        // clicks must start on the item, while virtual clicks represent explicit keyboard or
        // assistive technology activation.
        const isInvalidMouseClick =
          isMouseClick && !isVirtualMouseClick && !allowMouseSelectionRef.current;

        allowMouseSelectionRef.current = false;

        if (disabled || isInvalidMouseClick) {
          return;
        }

        commitSelection(event.nativeEvent);
      },
      onPointerEnter(event) {
        pointerTypeRef.current = event.pointerType;
      },
      onPointerMove(event) {
        if (event.pointerType === 'mouse' && event.buttons === 1) {
          const selection = selectionRef.current;
          selection.dragY += event.movementY;

          if (selection.dragY ** 2 >= 64) {
            selection.allowUnselectedMouseUp = true;
          }
        }
      },
      onPointerDown(event) {
        pointerTypeRef.current = event.pointerType;
        allowMouseSelectionRef.current = true;
        resetDragMovement();
      },
      onMouseUp() {
        resetDragMovement();

        if (disabled || pointerTypeRef.current === 'touch') {
          return;
        }

        // Regular clicks are committed by the click event.
        if (allowMouseSelectionRef.current) {
          return;
        }

        const disallowSelectedMouseUp = !selectionRef.current.allowSelectedMouseUp && selected;
        const disallowUnselectedMouseUp = !selectionRef.current.allowUnselectedMouseUp && !selected;

        if (disallowSelectedMouseUp || disallowUnselectedMouseUp) {
          return;
        }

        allowMouseSelectionRef.current = true;
        itemRef.current?.click();
        allowMouseSelectionRef.current = false;
      },
    };

    const element = useRenderElement('div', componentProps, {
      ref: [buttonRef, forwardedRef, listItem.ref, itemRef],
      state,
      props: [itemProps, defaultProps, elementProps, getButtonProps],
    });

    const contextValue: SelectItemContext = React.useMemo(
      () => ({
        selected,
        index,
        textElementRef,
      }),
      [selected, index, textElementRef],
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
  extends NonNativeButtonProps, Omit<BaseUIComponentProps<'div', SelectItemState>, 'id'> {
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
   * Specifies the text label to use during keyboard text navigation.
   *
   * Defaults to the item text content if not provided.
   */
  label?: string | undefined;
}

export namespace SelectItem {
  export type State = SelectItemState;
  export type Props = SelectItemProps;
}

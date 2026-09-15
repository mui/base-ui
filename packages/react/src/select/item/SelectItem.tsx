'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { warn } from '@base-ui/utils/warn';
import { useSelectRootContext, useSelectRootPropsContext } from '../root/SelectRootContext';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import type {
  BaseUIComponentProps,
  BaseUIEvent,
  HTMLProps,
  NonNativeButtonProps,
} from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { SelectItemContext } from './SelectItemContext';
import { useButton } from '../../internals/use-button';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import {
  compareItemEquality,
  removeItem,
  resolveSelectedIndex,
} from '../../internals/itemEquality';
import { isVirtualClick } from '../../floating-ui-react/utils/event';
import { useSelectVirtualItemContext } from './SelectVirtualItemContext';
import { useListVirtualizationHost } from '../../internals/virtualization/ListVirtualizationHostContext';
import {
  useNonVirtualizedItemRegistration,
  useVirtualItemDiagnostics,
} from '../../internals/virtualization/useListBinding';

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

    const textRef = React.useRef<HTMLElement | null>(null);
    const virtualItem = useSelectVirtualItemContext();
    const virtualized = virtualItem != null;
    const listItem = useCompositeListItem({
      guess: true,
      // A windowed row knows its logical index; render order describes only the mounted window.
      index: virtualItem?.index,
      label,
      textRef,
    });

    const store = useSelectRootContext();
    const insideList = useListVirtualizationHost() != null;

    useNonVirtualizedItemRegistration({
      componentName: store.context.componentName,
      insideList,
      registry: store.context.virtualizationRegistry,
      virtualized,
    });
    const { itemProps, multiple, disabled: selectDisabled, readOnly } = useSelectRootPropsContext();
    const isItemDisabled = store.useState('isItemDisabled');
    const disabled =
      selectDisabled ||
      disabledProp ||
      (listItem.index >= 0 && isItemDisabled?.(itemValue, listItem.index) === true);
    const highlighted = store.useState('isActive', listItem.index);
    const open = store.useState('open');
    const selected = store.useState('isSelected', itemValue);
    const selectedByFocus = store.useState('isSelectedByFocus', listItem.index);
    const isItemEqualToValue = store.useState('isItemEqualToValue');

    const index = listItem.index;

    const itemRef = React.useRef<HTMLDivElement | null>(null);

    if (process.env.NODE_ENV !== 'production') {
      // The root derives typeahead labels from `items` while virtualized, so `CompositeList` is
      // given no `labelsRef` and this prop would be collected by nobody.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useIsoLayoutEffect(() => {
        if (virtualized && label != null) {
          warn(
            `A virtualized <${store.context.componentName}.Item> received a \`label\` prop, which ` +
              'is ignored: typeahead matches labels derived from the `items` prop on ' +
              `<${store.context.componentName}.Root>. Pass \`itemToStringLabel\` there instead.`,
          );
        }
      }, [label, store, virtualized]);
    }

    useVirtualItemDiagnostics({
      componentName: store.context.componentName,
      disabledProp,
      hasIsItemDisabled: isItemDisabled != null,
      virtualItem,
    });

    useIsoLayoutEffect(() => {
      // The root derives the whole collection's values from `items` while a virtualizer is
      // registered. A row must not write there — and above all must not delete on unmount, which
      // scrolling would do constantly, punching holes in a complete array.
      if (virtualized) {
        return undefined;
      }

      const values = store.context.valuesRef.current;
      values[index] = itemValue;

      return () => {
        delete values[index];
      };
    }, [index, itemValue, store, virtualized]);

    useIsoLayoutEffect(() => {
      if (!virtualized || index < 0) {
        return undefined;
      }

      // Republished directly as well as through the composite registration, so list navigation can
      // focus a row that has just been mounted for it.
      const list = store.context.listRef.current;
      list[index] = itemRef.current;

      return () => {
        delete list[index];
      };
    }, [index, store, virtualized]);

    useIsoLayoutEffect(() => {
      // `selectedIndex` follows the whole collection when virtualized, and the root owns it: a
      // window cannot see whether an unmounted row is the selected one.
      if (virtualized) {
        return;
      }

      const selectedValue = store.state.value;

      const currentIndex = store.state.selectedIndex;
      let nextIndex = currentIndex;
      let claims: boolean;
      if (multiple && Array.isArray(selectedValue)) {
        // The claiming item also owns the text ref that aligns the popup.
        nextIndex = resolveSelectedIndex(
          index,
          itemValue,
          store.context.valuesRef.current,
          selectedValue,
          isItemEqualToValue,
          currentIndex,
        );
        claims = nextIndex === index;
        if (index === currentIndex && !claims) {
          store.context.selectedItemTextRef.current = null;
        }
      } else {
        claims =
          selectedValue !== undefined &&
          compareItemEquality(itemValue, selectedValue, isItemEqualToValue);
        if (claims) {
          nextIndex = index;
        }
      }
      store.set('selectedIndex', nextIndex);

      // Make sure SelectPopup can measure the selected item on first open.
      // SelectItemText can still update this ref later when focus moves.
      if (claims && textRef.current) {
        store.context.selectedItemTextRef.current = textRef.current;
      }
    }, [index, multiple, isItemEqualToValue, store, itemValue, virtualized]);

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
        store.context.setValue(nextValue, createChangeEventDetails(REASONS.itemPress, event));
      } else {
        store.context.setValue(itemValue, createChangeEventDetails(REASONS.itemPress, event));
        store.context.setOpen(false, createChangeEventDetails(REASONS.itemPress, event));
      }
    }

    function resetDragMovement() {
      store.context.selectionRef.current.dragY = 0;
    }

    const defaultProps: HTMLProps = {
      role: 'option',
      'aria-selected': selected,
      tabIndex: open && highlighted ? 0 : -1,
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent>) {
        store.context.setActiveIndex(index, 'keyboard');

        if (event.key === ' ' && store.context.typingRef.current) {
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
          const selection = store.context.selectionRef.current;
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

        const disallowSelectedMouseUp =
          !store.context.selectionRef.current.allowSelectedMouseUp && selected;
        const disallowUnselectedMouseUp =
          !store.context.selectionRef.current.allowUnselectedMouseUp && !selected;

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
      props: [itemProps, virtualItem?.props, defaultProps, elementProps, getButtonProps],
    });

    const contextValue: SelectItemContext = React.useMemo(
      () => ({
        selected,
        index,
        textRef,
        selectedByFocus,
      }),
      [selected, index, textRef, selectedByFocus],
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

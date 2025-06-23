import * as React from 'react';
import type { HTMLProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { mergeProps } from '../../merge-props';
import { useSelectRootContext } from '../root/SelectRootContext';
import type { SelectRootContext } from '../root/SelectRootContext';
import { useForkRef } from '../../utils/useForkRef';
import { isMouseWithinBounds } from '../../utils/isMouseWithinBounds';

export function useSelectItem(params: useSelectItem.Parameters): useSelectItem.ReturnValue {
  const {
    disabled = false,
    highlighted,
    selected,
    ref: externalRef,
    setOpen,
    typingRef,
    handleSelect,
    selectionRef,
    indexRef,
    keyboardActiveRef,
    elementProps,
    rootProps,
    nativeButton,
  } = params;

  const ref = React.useRef<HTMLDivElement | null>(null);
  const lastKeyRef = React.useRef<string | null>(null);
  const pointerTypeRef = React.useRef<'mouse' | 'touch' | 'pen'>('mouse');
  const didPointerDownRef = React.useRef(false);

  const { store, highlightTimeout } = useSelectRootContext();

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton,
  });

  const mergedRef = useForkRef(externalRef, ref, buttonRef);

  const commitSelection = (event: MouseEvent) => {
    handleSelect(event);
    setOpen(false, event, 'item-press');
  };

  const props = mergeProps<'div'>(
    rootProps,
    {
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
        if (keyboardActiveRef.current) {
          return;
        }

        if (isMouseWithinBounds(event)) {
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
          allowSelect: true,
        };
      },
      onKeyDown(event) {
        selectionRef.current.allowSelect = true;
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

        if (selectionRef.current.allowSelect) {
          lastKeyRef.current = null;
          commitSelection(event.nativeEvent);
        }
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

        if (selectionRef.current.allowSelect || !selected) {
          commitSelection(event.nativeEvent);
        }

        selectionRef.current.allowSelect = true;
      },
    },
    elementProps,
    getButtonProps,
  );

  return {
    rootRef: mergedRef,
    props,
  };
}

export namespace useSelectItem {
  export interface Parameters {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Determines if the select item is highlighted.
     */
    highlighted: boolean;
    /**
     * Determines if the select item is selected.
     */
    selected: boolean;
    /**
     * The ref of the trigger element.
     */
    ref?: React.Ref<Element>;
    /**
     * The function to set the open state of the select.
     */
    setOpen: SelectRootContext['setOpen'];
    /**
     * Determines if the user is currently typing for typeahead matching.
     */
    typingRef: React.RefObject<boolean>;
    /**
     * The function to handle the selection of the item.
     */
    handleSelect: (event: MouseEvent) => void;
    /**
     * The ref to the selection state of the item.
     */
    selectionRef: React.RefObject<{
      allowSelectedMouseUp: boolean;
      allowUnselectedMouseUp: boolean;
      allowSelect: boolean;
    }>;
    /**
     * A ref to the index of the item.
     */
    indexRef: React.RefObject<number>;
    keyboardActiveRef: React.RefObject<boolean>;
    elementProps: HTMLProps;
    rootProps: HTMLProps;
    nativeButton: boolean;
  }

  export interface ReturnValue {
    props: HTMLProps;
    rootRef: React.RefCallback<Element> | null;
  }
}

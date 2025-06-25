'use client';
import * as React from 'react';
import {
  useModernLayoutEffect,
  useLatestRef,
  isMouseWithinBounds,
} from '@base-ui-components/react-utils';
import { useSelectRootContext } from '../root/SelectRootContext';
import {
  useCompositeListItem,
  IndexGuessBehavior,
} from '../../composite/list/useCompositeListItem';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useSelector } from '../../utils/store';
import { useRenderElement } from '../../utils/useRenderElement';
import { SelectItemContext } from './SelectItemContext';
import { selectors } from '../store';
import { useButton } from '../../use-button';

/**
 * An individual option in the select menu.
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
      registerSelectedItem,
      keyboardActiveRef,
      highlightTimeout,
    } = useSelectRootContext();

    const highlighted = useSelector(store, selectors.isActive, listItem.index);
    const selected = useSelector(store, selectors.isSelected, listItem.index, value);
    const rootValue = useSelector(store, selectors.value);

    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const indexRef = useLatestRef(listItem.index);

    const hasRegistered = listItem.index !== -1;

    useModernLayoutEffect(() => {
      if (!hasRegistered) {
        return undefined;
      }

      const values = valuesRef.current;
      values[listItem.index] = value;

      return () => {
        delete values[listItem.index];
      };
    }, [hasRegistered, listItem.index, value, valuesRef]);

    useModernLayoutEffect(() => {
      if (hasRegistered && value === rootValue) {
        registerSelectedItem(listItem.index);
      }
    }, [hasRegistered, listItem.index, registerSelectedItem, value, rootValue]);

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
      setValue(value, event);
      setOpen(false, event, 'item-press');
    }

    const defaultProps: HTMLProps = {
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
        if (keyboardActiveRef.current || !isMouseWithinBounds(event)) {
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
      }),
      [selected, indexRef, textRef],
    );

    return <SelectItemContext.Provider value={contextValue}>{element}</SelectItemContext.Provider>;
  }),
);

export namespace SelectItem {
  export interface State {
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

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'id'> {
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
     * Overrides the text label to use on the trigger when this item is selected
     * and when the item is matched during keyboard text navigation.
     */
    label?: string;
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default false
     */
    nativeButton?: boolean;
  }
}

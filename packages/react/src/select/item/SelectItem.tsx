'use client';
import * as React from 'react';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectIndexContext } from '../root/SelectIndexContext';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import type { BaseUIComponentProps } from '../../utils/types';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useLatestRef } from '../../utils/useLatestRef';
import { useTimeout } from '../../utils/useTimeout';
import { useEventCallback } from '../../utils/useEventCallback';
import { addHighlight, hasHighlight, removeHighlight } from '../../utils/highlighted';
import { isMouseWithinBounds } from '../../utils/isMouseWithinBounds';
import { AnimationFrame } from '../../utils/useAnimationFrame';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { mergeProps } from '../../merge-props';
import { SelectItemContext } from './SelectItemContext';

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
      value: valueProp = null,
      label,
      disabled = false,
      ...elementProps
    } = componentProps;

    const listItem = useCompositeListItem({ label });

    const { activeIndex, selectedIndex, setActiveIndex } = useSelectIndexContext();
    const {
      getItemProps,
      setOpen,
      setValue,
      open,
      selectionRef,
      typingRef,
      valuesRef,
      popupRef,
      registerSelectedItem,
      value,
      keyboardActiveRef,
      floatingRootContext,
    } = useSelectRootContext();
    const events = floatingRootContext.events;

    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const selectedIndexRef = useLatestRef(selectedIndex);
    const indexRef = useLatestRef(listItem.index);

    const hasRegistered = listItem.index !== -1;

    useModernLayoutEffect(() => {
      if (!hasRegistered) {
        return undefined;
      }

      const values = valuesRef.current;
      values[listItem.index] = valueProp;

      return () => {
        delete values[listItem.index];
      };
    }, [hasRegistered, listItem.index, valueProp, valuesRef]);

    useModernLayoutEffect(() => {
      if (hasRegistered && valueProp === value) {
        registerSelectedItem(listItem.index);
      }
    }, [hasRegistered, listItem.index, registerSelectedItem, valueProp, value]);

    const highlighted = activeIndex === listItem.index;
    const selected = selectedIndex === listItem.index;

    const state: SelectItem.State = React.useMemo(
      () => ({
        disabled,
        selected,
      }),
      [disabled, selected],
    );

    const rootProps = getItemProps({ active: highlighted, selected });
    // With our custom `focusItemOnHover` implementation, this interferes with the logic and can
    // cause the index state to be stuck when leaving the select popup.
    delete rootProps.onFocus;
    delete rootProps.id;

    const handleSelect = (event: any) => setValue(valueProp, event);

    const ref = React.useRef<HTMLDivElement | null>(null);
    const lastKeyRef = React.useRef<string | null>(null);
    const pointerTypeRef = React.useRef<'mouse' | 'touch' | 'pen'>('mouse');
    const didPointerDownRef = React.useRef(false);
    const prevPopupHeightRef = React.useRef(0);
    const allowFocusSyncRef = React.useRef(true);
    const cursorMovementTimeout = useTimeout();

    const { getButtonProps } = useButton({
      elementName: 'div',
      disabled,
      focusableWhenDisabled: true,
    });

    const commitSelection = useEventCallback((event: MouseEvent) => {
      handleSelect(event);
      setOpen(false, event, 'item-press');
    });

    const handlePopupLeave = useEventCallback(() => {
      if (cursorMovementTimeout.isStarted()) {
        cursorMovementTimeout.clear();
        removeHighlight(ref);
      }
    });

    React.useEffect(() => {
      return handlePopupLeave;
    }, [handlePopupLeave]);

    useModernLayoutEffect(() => {
      if (!open) {
        return;
      }

      if (highlighted) {
        addHighlight(ref);
      } else {
        removeHighlight(ref);
      }
    }, [open, highlighted]);

    React.useEffect(() => {
      function handleItemHover(item: HTMLDivElement) {
        if (ref.current && item !== ref.current) {
          removeHighlight(ref);
        }
      }

      events.on('itemhover', handleItemHover);
      return () => {
        events.off('itemhover', handleItemHover);
      };
    }, [events, setActiveIndex, indexRef]);

    const props = mergeProps<'div'>(
      rootProps,
      {
        'aria-disabled': disabled || undefined,
        tabIndex: highlighted ? 0 : -1,
        onFocus() {
          if (
            allowFocusSyncRef.current &&
            keyboardActiveRef.current &&
            cursorMovementTimeout.isStarted() === false
          ) {
            setActiveIndex(indexRef.current);
          }
        },
        onMouseEnter() {
          if (!keyboardActiveRef.current && selectedIndexRef.current === null) {
            addHighlight(ref);
            events.emit('itemhover', ref.current);
          }
        },
        onMouseMove() {
          if (keyboardActiveRef.current) {
            setActiveIndex(indexRef.current);
          } else {
            addHighlight(ref);
            events.emit('itemhover', ref.current);
          }

          if (popupRef.current) {
            prevPopupHeightRef.current = popupRef.current.offsetHeight;
          }

          events.off('popupleave', handlePopupLeave);
          events.on('popupleave', handlePopupLeave);
          // When this fires, the cursor has stopped moving.
          cursorMovementTimeout.start(50, () => {
            setActiveIndex(indexRef.current);
          });
        },
        onMouseLeave(event) {
          const popup = popupRef.current;
          if (!popup || !open || keyboardActiveRef.current) {
            return;
          }

          if (isMouseWithinBounds(event)) {
            return;
          }

          removeHighlight(ref);
          events.off('popupleave', handlePopupLeave);

          const wasCursorStationary = cursorMovementTimeout.isStarted() === false;
          if (!wasCursorStationary) {
            cursorMovementTimeout.clear();
          }

          // With `alignItemWithTrigger=true`, avoid re-rendering the root due to `onMouseLeave`
          // firing and causing a performance issue when expanding the popup.
          if (popup.offsetHeight === prevPopupHeightRef.current) {
            // Prevent `onFocus` from causing the highlight to be stuck when quickly moving
            // the mouse out of the popup.
            allowFocusSyncRef.current = false;

            if (keyboardActiveRef.current || wasCursorStationary) {
              setActiveIndex(null);
            }

            AnimationFrame.request(() => {
              cursorMovementTimeout.clear();
              allowFocusSyncRef.current = true;
            });
          }
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
          setActiveIndex(indexRef.current);
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
            (pointerTypeRef.current !== 'touch' && !hasHighlight(ref))
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
          const disallowUnselectedMouseUp =
            !selectionRef.current.allowUnselectedMouseUp && !selected;

          if (
            disallowSelectedMouseUp ||
            disallowUnselectedMouseUp ||
            (pointerTypeRef.current !== 'touch' && !hasHighlight(ref))
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

    const element = useRenderElement('div', componentProps, {
      ref: [ref, forwardedRef, listItem.ref, itemRef],
      state,
      props,
    });

    const contextValue = React.useMemo(
      () => ({
        selected,
        indexRef,
      }),
      [selected, indexRef],
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
  }
}

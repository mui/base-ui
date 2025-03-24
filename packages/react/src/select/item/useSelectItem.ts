import * as React from 'react';
import type { FloatingEvents } from '@floating-ui/react';
import type { GenericHTMLProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { mergeProps } from '../../merge-props';
import type { SelectRootContext } from '../root/SelectRootContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { SelectIndexContext } from '../root/SelectIndexContext';
import { useForkRef } from '../../utils/useForkRef';
import { useEnhancedEffect } from '../../utils';

const styleHook = 'data-highlighted';

export function useSelectItem(params: useSelectItem.Parameters): useSelectItem.ReturnValue {
  const {
    open,
    disabled = false,
    highlighted,
    selected,
    ref: externalRef,
    setOpen,
    typingRef,
    handleSelect,
    selectionRef,
    indexRef,
    setActiveIndex,
    popupRef,
    keyboardActiveRef,
    events,
  } = params;

  const ref = React.useRef<HTMLDivElement | null>(null);
  const lastKeyRef = React.useRef<string | null>(null);
  const pointerTypeRef = React.useRef<'mouse' | 'touch' | 'pen'>('mouse');

  const prevPopupHeightRef = React.useRef(0);
  const allowFocusSyncRef = React.useRef(true);
  const cursorMovementTimerRef = React.useRef(-1);

  const mergedRef = useForkRef(externalRef, ref);

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    buttonRef: mergedRef,
  });

  const commitSelection = useEventCallback((event: Event) => {
    handleSelect();
    setOpen(false, event);
  });

  const handlePopupLeave = useEventCallback(() => {
    if (cursorMovementTimerRef.current !== -1) {
      ref.current?.removeAttribute(styleHook);
      clearTimeout(cursorMovementTimerRef.current);
      cursorMovementTimerRef.current = -1;
    }
  });

  React.useEffect(() => {
    return handlePopupLeave;
  }, [handlePopupLeave]);

  useEnhancedEffect(() => {
    if (highlighted) {
      ref.current?.setAttribute(styleHook, '');
    } else {
      ref.current?.removeAttribute(styleHook);
    }
  }, [highlighted]);

  React.useEffect(() => {
    function handleItemMouseMove(item: HTMLDivElement) {
      if (ref.current && item !== ref.current) {
        ref.current.removeAttribute(styleHook);
      }
    }

    events.on('item-mousemove', handleItemMouseMove);
    return () => {
      events.off('item-mousemove', handleItemMouseMove);
    };
  }, [events, setActiveIndex, indexRef]);

  const getItemProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return getButtonProps(
        mergeProps<'div'>(
          {
            'aria-disabled': disabled || undefined,
            tabIndex: highlighted ? 0 : -1,
            onFocus() {
              if (
                allowFocusSyncRef.current &&
                keyboardActiveRef.current &&
                cursorMovementTimerRef.current === -1
              ) {
                setActiveIndex(indexRef.current);
              }
            },
            onMouseMove() {
              if (keyboardActiveRef.current) {
                setActiveIndex(indexRef.current);
              } else {
                ref.current?.setAttribute(styleHook, '');
                events.emit('item-mousemove', ref.current);
              }

              if (popupRef.current) {
                prevPopupHeightRef.current = popupRef.current.offsetHeight;
              }

              if (cursorMovementTimerRef.current !== -1) {
                events.off('popup-leave', handlePopupLeave);
                clearTimeout(cursorMovementTimerRef.current);
              }
              events.on('popup-leave', handlePopupLeave);
              // When this fires, the cursor has stopped moving.
              cursorMovementTimerRef.current = window.setTimeout(() => {
                setActiveIndex(indexRef.current);
                cursorMovementTimerRef.current = -1;
              }, 50);
            },
            onMouseLeave(event) {
              const popup = popupRef.current;
              if (!popup || !open || keyboardActiveRef.current) {
                return;
              }

              const targetRect = event.currentTarget.getBoundingClientRect();

              // Safari randomly fires `mouseleave` incorrectly when the item is
              // aligned to the trigger. This is a workaround to prevent the highlight
              // from being removed while the cursor is still within the bounds of the item.
              // https://github.com/mui/base-ui/issues/869
              const isWithinBounds =
                targetRect.top + 1 <= event.clientY &&
                event.clientY <= targetRect.bottom - 1 &&
                targetRect.left + 1 <= event.clientX &&
                event.clientX <= targetRect.right - 1;

              if (isWithinBounds) {
                return;
              }

              ref.current?.removeAttribute(styleHook);
              events.off('popup-leave', handlePopupLeave);

              const wasCursorStationary = cursorMovementTimerRef.current === -1;

              if (!wasCursorStationary) {
                clearTimeout(cursorMovementTimerRef.current);
                cursorMovementTimerRef.current = -1;
              }

              // With `alignItemToTrigger`, avoid re-rendering the root due to `onMouseLeave`
              // firing and causing a performance issue when expanding the popup.
              if (popup.offsetHeight === prevPopupHeightRef.current) {
                // Prevent `onFocus` from causing the highlight to be stuck when quickly moving
                // the mouse out of the popup.
                allowFocusSyncRef.current = false;

                if (keyboardActiveRef.current || wasCursorStationary) {
                  setActiveIndex(null);
                }

                requestAnimationFrame(() => {
                  clearTimeout(cursorMovementTimerRef.current);
                  popup.focus({ preventScroll: true });
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
              if (
                disabled ||
                (lastKeyRef.current === ' ' && typingRef.current) ||
                (pointerTypeRef.current !== 'touch' && !ref.current?.hasAttribute(styleHook))
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
            },
            onMouseUp(event) {
              if (disabled) {
                return;
              }
              const disallowSelectedMouseUp =
                !selectionRef.current.allowSelectedMouseUp && selected;
              const disallowUnselectedMouseUp =
                !selectionRef.current.allowUnselectedMouseUp && !selected;

              if (
                disallowSelectedMouseUp ||
                disallowUnselectedMouseUp ||
                (pointerTypeRef.current !== 'touch' && !ref.current?.hasAttribute(styleHook))
              ) {
                return;
              }

              if (selectionRef.current.allowSelect || !selected) {
                commitSelection(event.nativeEvent);
              }

              selectionRef.current.allowSelect = true;
            },
          },
          externalProps,
          getButtonProps,
        ),
      );
    },
    [
      commitSelection,
      disabled,
      events,
      getButtonProps,
      handlePopupLeave,
      highlighted,
      indexRef,
      keyboardActiveRef,
      open,
      popupRef,
      selected,
      selectionRef,
      setActiveIndex,
      typingRef,
    ],
  );

  return React.useMemo(
    () => ({
      getItemProps,
      rootRef: buttonRef,
    }),
    [getItemProps, buttonRef],
  );
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
     * Whether the select menu is currently open.
     */
    open: boolean;
    /**
     * The function to set the open state of the select.
     */
    setOpen: SelectRootContext['setOpen'];
    /**
     * Determines if the user is currently typing for typeahead matching.
     */
    typingRef: React.MutableRefObject<boolean>;
    /**
     * The function to handle the selection of the item.
     */
    handleSelect: () => void;
    /**
     * The ref to the selection state of the item.
     */
    selectionRef: React.MutableRefObject<{
      allowSelectedMouseUp: boolean;
      allowUnselectedMouseUp: boolean;
      allowSelect: boolean;
    }>;
    /**
     * A ref to the index of the selected item.
     */
    selectedIndexRef: React.RefObject<number | null>;
    /**
     * A ref to the index of the item.
     */
    indexRef: React.RefObject<number>;
    setActiveIndex: SelectIndexContext['setActiveIndex'];
    popupRef: React.RefObject<HTMLDivElement | null>;
    keyboardActiveRef: React.RefObject<boolean>;
    events: FloatingEvents;
  }

  export interface ReturnValue {
    getItemProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    rootRef: React.RefCallback<Element> | null;
  }
}

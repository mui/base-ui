import * as React from 'react';
import type { FloatingEvents } from '@floating-ui/react';
import type { HTMLProps } from '../../utils/types';
import { useButton } from '../../use-button';
import { mergeProps } from '../../merge-props';
import { useSelectRootContext } from '../root/SelectRootContext';
import type { SelectRootContext } from '../root/SelectRootContext';
import { useTimeout } from '../../utils/useTimeout';
import { useEventCallback } from '../../utils/useEventCallback';
import { useForkRef } from '../../utils/useForkRef';
import { useModernLayoutEffect } from '../../utils';
import { addHighlight, hasHighlight, removeHighlight } from '../../utils/highlighted';
import { isMouseWithinBounds } from '../../utils/isMouseWithinBounds';
import { AnimationFrame } from '../../utils/useAnimationFrame';

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
    popupRef,
    keyboardActiveRef,
    events,
    elementProps,
    rootProps,
  } = params;

  const ref = React.useRef<HTMLDivElement | null>(null);
  const lastKeyRef = React.useRef<string | null>(null);
  const pointerTypeRef = React.useRef<'mouse' | 'touch' | 'pen'>('mouse');
  const didPointerDownRef = React.useRef(false);
  const prevPopupHeightRef = React.useRef(0);
  const allowFocusSyncRef = React.useRef(true);
  const cursorMovementTimeout = useTimeout();

  const { store } = useSelectRootContext();

  const mergedRef = useForkRef(externalRef, ref);

  const { getButtonProps, buttonRef } = useButton({
    // XXX: This is brittle, it will cause a re-render if the user passes a `render` prop.
    elementName: 'div',
    disabled,
    focusableWhenDisabled: true,
    buttonRef: mergedRef,
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
    if (highlighted) {
      addHighlight(ref);
    } else {
      removeHighlight(ref);
    }
  }, [highlighted]);

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
  }, [events, indexRef]);

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
          store.set('activeIndex', indexRef.current);
        }
      },
      onMouseEnter() {
        if (!keyboardActiveRef.current && store.state.selectedIndex === null) {
          addHighlight(ref);
          events.emit('itemhover', ref.current);
        }
      },
      onMouseMove() {
        if (keyboardActiveRef.current) {
          store.set('activeIndex', indexRef.current);
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
          store.set('activeIndex', indexRef.current);
        });
      },
      onMouseLeave(event) {
        const popup = popupRef.current;
        if (!popup || keyboardActiveRef.current) {
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
            store.set('activeIndex', null);
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
        const disallowUnselectedMouseUp = !selectionRef.current.allowUnselectedMouseUp && !selected;

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

  return {
    rootRef: buttonRef,
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
    typingRef: React.MutableRefObject<boolean>;
    /**
     * The function to handle the selection of the item.
     */
    handleSelect: (event: MouseEvent) => void;
    /**
     * The ref to the selection state of the item.
     */
    selectionRef: React.MutableRefObject<{
      allowSelectedMouseUp: boolean;
      allowUnselectedMouseUp: boolean;
      allowSelect: boolean;
    }>;
    /**
     * A ref to the index of the item.
     */
    indexRef: React.RefObject<number>;
    popupRef: React.RefObject<HTMLDivElement | null>;
    keyboardActiveRef: React.RefObject<boolean>;
    events: FloatingEvents;
    elementProps: HTMLProps;
    rootProps: HTMLProps;
  }

  export interface ReturnValue {
    props: HTMLProps;
    rootRef: React.RefCallback<Element> | null;
  }
}

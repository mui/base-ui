'use client';
import * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';
import { useButton } from '../../useButton';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { SelectRootContext } from '../Root/SelectRootContext';
import { useEventCallback } from '../../utils/useEventCallback';

/**
 *
 * API:
 *
 * - [useSelectOption API](https://mui.com/base-ui/api/use-select-option/)
 */
export function useSelectOption(params: useSelectOption.Parameters): useSelectOption.ReturnValue {
  const {
    disabled = false,
    highlighted,
    selected,
    id,
    ref: externalRef,
    setOpen,
    typingRef,
    handleSelect,
    selectionRef,
  } = params;

  const { getRootProps: getButtonProps, rootRef: mergedRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    rootRef: externalRef,
  });

  const commitSelection = useEventCallback((event: Event) => {
    handleSelect();
    setOpen(false, event);
  });

  const lastKeyRef = React.useRef<string | null>(null);
  const pointerTypeRef = React.useRef<'mouse' | 'touch' | 'pen'>('mouse');

  const getItemProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return getButtonProps(
        mergeReactProps<'div'>(externalProps, {
          'aria-disabled': disabled || undefined,
          id,
          tabIndex: highlighted ? 0 : -1,
          style: {
            pointerEvents: disabled ? 'none' : undefined,
          },
          onTouchStart() {
            selectionRef.current = { mouseUp: false, select: true };
          },
          onKeyDown(event) {
            selectionRef.current.select = true;
            lastKeyRef.current = event.key;
          },
          onClick(event) {
            if (
              (lastKeyRef.current === ' ' && typingRef.current) ||
              (pointerTypeRef.current !== 'touch' && !highlighted)
            ) {
              return;
            }

            if (selectionRef.current.select) {
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
            if (
              !selectionRef.current.mouseUp ||
              (pointerTypeRef.current !== 'touch' && !highlighted)
            ) {
              return;
            }

            if (selectionRef.current.select || !selected) {
              commitSelection(event.nativeEvent);
            }

            selectionRef.current.select = true;
          },
        }),
      );
    },
    [commitSelection, disabled, getButtonProps, highlighted, id, selected, selectionRef, typingRef],
  );

  return React.useMemo(
    () => ({
      getItemProps,
      rootRef: mergedRef,
    }),
    [getItemProps, mergedRef],
  );
}

export namespace useSelectOption {
  export interface Parameters {
    /**
     * If `true`, the select will close when the select item is clicked.
     */
    closeOnClick: boolean;
    /**
     * If `true`, the select item will be disabled.
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
     * The id of the select item.
     */
    id: string | undefined;
    /**
     * The ref of the trigger element.
     */
    ref?: React.Ref<Element>;
    setOpen: SelectRootContext['setOpen'];
    typingRef: React.MutableRefObject<boolean>;
    handleSelect: () => void;
    selectionRef: React.MutableRefObject<{
      mouseUp: boolean;
      select: boolean;
    }>;
  }

  export interface ReturnValue {
    getItemProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    rootRef: React.RefCallback<Element> | null;
  }
}

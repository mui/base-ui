import * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';
import { useButton } from '../../useButton';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { SelectRootContext } from '../SelectRoot';
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

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    buttonRef: externalRef,
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
            selectionRef.current = { allowMouseUp: false, allowSelect: true };
          },
          onKeyDown(event) {
            selectionRef.current.allowSelect = true;
            lastKeyRef.current = event.key;
          },
          onClick(event) {
            if (
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
          },
          onMouseUp(event) {
            if (
              (!selectionRef.current.allowMouseUp && selected) ||
              (pointerTypeRef.current !== 'touch' && !highlighted)
            ) {
              return;
            }

            if (selectionRef.current.allowSelect || !selected) {
              commitSelection(event.nativeEvent);
            }

            selectionRef.current.allowSelect = true;
          },
        }),
      );
    },
    [commitSelection, disabled, getButtonProps, highlighted, id, selected, selectionRef, typingRef],
  );

  return React.useMemo(
    () => ({
      getItemProps,
      rootRef: buttonRef,
    }),
    [getItemProps, buttonRef],
  );
}

export namespace useSelectOption {
  export interface Parameters {
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
    /**
     * The function to set the open state of the select.
     */
    setOpen: SelectRootContext['setOpen'];
    /**
     * Determines if the user is currently typing for typeahead matching.
     */
    typingRef: React.MutableRefObject<boolean>;
    /**
     * The function to handle the selection of the option.
     */
    handleSelect: () => void;
    /**
     * The ref to the selection state of the option.
     */
    selectionRef: React.MutableRefObject<{
      allowMouseUp: boolean;
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
  }

  export interface ReturnValue {
    getItemProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    rootRef: React.RefCallback<Element> | null;
  }
}

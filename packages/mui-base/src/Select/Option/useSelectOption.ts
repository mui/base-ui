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

  const getItemProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return getButtonProps(
        mergeReactProps<'div'>(externalProps, {
          id,
          tabIndex: highlighted ? 0 : -1,
          onTouchStart() {
            selectionRef.current = { mouseUp: false, select: true };
          },
          onKeyDown(event) {
            selectionRef.current.select = true;
            lastKeyRef.current = event.key;
          },
          onClick(event) {
            if (lastKeyRef.current === ' ' && typingRef.current) {
              return;
            }

            if (selectionRef.current.select) {
              lastKeyRef.current = null;
              commitSelection(event.nativeEvent);
            }
          },
          onMouseUp(event) {
            if (!selectionRef.current.mouseUp) {
              return;
            }

            if (selectionRef.current.select) {
              commitSelection(event.nativeEvent);
            }

            selectionRef.current.select = true;
          },
        }),
      );
    },
    [commitSelection, getButtonProps, highlighted, id, selectionRef, typingRef],
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

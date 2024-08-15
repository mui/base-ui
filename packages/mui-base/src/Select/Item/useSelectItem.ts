'use client';
import * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';
import { useButton } from '../../useButton';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { SelectRootContext } from '../Root/SelectRootContext';

/**
 *
 * API:
 *
 * - [useSelectItem API](https://mui.com/base-ui/api/use-select-item/)
 */
export function useSelectItem(params: useSelectItem.Parameters): useSelectItem.ReturnValue {
  const {
    disabled = false,
    highlighted,
    id,
    ref: externalRef,
    treatMouseupAsClick,
    setOpen,
    typingRef,
    handleSelect,
  } = params;

  const { getRootProps: getButtonProps, rootRef: mergedRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    rootRef: externalRef,
  });

  const getItemProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return getButtonProps(
        mergeReactProps<'div'>(externalProps, {
          ['data-handle-mouseup' as string]: treatMouseupAsClick || undefined,
          id,
          tabIndex: highlighted ? 0 : -1,
          onClick(event) {
            if (typingRef.current) {
              return;
            }

            handleSelect();
            setOpen(false, event.nativeEvent);
          },
        }),
      );
    },
    [getButtonProps, handleSelect, highlighted, id, setOpen, treatMouseupAsClick, typingRef],
  );

  return React.useMemo(
    () => ({
      getItemProps,
      rootRef: mergedRef,
    }),
    [getItemProps, mergedRef],
  );
}

export namespace useSelectItem {
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
     * The id of the select item.
     */
    id: string | undefined;
    /**
     * The ref of the trigger element.
     */
    ref?: React.Ref<Element>;
    /**
     * If `true`, the select item will listen for mouseup events and treat them as clicks.
     */
    treatMouseupAsClick: boolean;
    setOpen: SelectRootContext['setOpen'];
    typingRef: React.MutableRefObject<boolean>;
    handleSelect: () => void;
  }

  export interface ReturnValue {
    getItemProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    rootRef: React.RefCallback<Element> | null;
  }
}

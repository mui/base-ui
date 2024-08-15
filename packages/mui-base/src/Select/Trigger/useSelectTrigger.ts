'use client';
import * as React from 'react';
import { getTarget } from '@floating-ui/react/utils';
import { useButton } from '../../useButton/useButton';
import type { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ownerDocument } from '../../utils/owner';
import { useForkRef } from '../../utils/useForkRef';
import { useSelectRootContext } from '../Root/SelectRootContext';

/**
 *
 * API:
 *
 * - [useSelectTrigger API](https://mui.com/base-ui/api/use-select-trigger/)
 */
export function useSelectTrigger(
  parameters: useSelectTrigger.Parameters,
): useSelectTrigger.ReturnValue {
  const { disabled = false, rootRef: externalRef } = parameters;

  const { selectedValue, open, setOpen, setClickAndDragEnabled, setTriggerElement } =
    useSelectRootContext();

  const triggerRef = React.useRef<HTMLElement | null>(null);

  const mergedRef = useForkRef(externalRef, triggerRef);

  const { getRootProps: getButtonProps, rootRef: buttonRootRef } = useButton({
    disabled,
    focusableWhenDisabled: false,
    rootRef: mergedRef,
  });

  const handleRef = useForkRef(buttonRootRef, setTriggerElement);
  const ignoreNextClickRef = React.useRef(false);

  const getTriggerProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return mergeReactProps<'div'>(
        { ...externalProps, children: selectedValue ?? externalProps?.children },
        {
          tabIndex: 0, // this is needed to make the button focused after click in Safari
          ref: handleRef,
          onMouseDown(event) {
            if (open) {
              return;
            }

            // prevents closing the menu right after it was opened
            ignoreNextClickRef.current = true;
            event.preventDefault();

            setClickAndDragEnabled(true);

            const mousedownTarget = getTarget(event.nativeEvent) as Element | null;
            const doc = ownerDocument(mousedownTarget);

            function handleDocumentMouseUp(mouseUpEvent: MouseEvent) {
              const mouseupTarget = mouseUpEvent.target as HTMLElement;
              if (mouseupTarget?.dataset?.handleMouseup === 'true') {
                mouseupTarget.click();
              } else if (
                mouseupTarget !== triggerRef.current &&
                !triggerRef.current?.contains(mouseupTarget)
              ) {
                setOpen(false, mouseUpEvent);
              }

              setClickAndDragEnabled(false);
              doc.removeEventListener('mouseup', handleDocumentMouseUp);
            }

            doc.addEventListener('mouseup', handleDocumentMouseUp);
          },
          onClick() {
            if (ignoreNextClickRef.current) {
              ignoreNextClickRef.current = false;
            }
          },
        },
        getButtonProps(),
      );
    },
    [selectedValue, handleRef, getButtonProps, open, setClickAndDragEnabled, setOpen],
  );

  return React.useMemo(
    () => ({
      getTriggerProps,
      rootRef: handleRef,
    }),
    [getTriggerProps, handleRef],
  );
}

export namespace useSelectTrigger {
  export interface Parameters {
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * The ref to the root element.
     */
    rootRef?: React.Ref<HTMLElement>;
  }

  export interface ReturnValue {
    getTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    rootRef: React.RefCallback<Element> | null;
  }
}

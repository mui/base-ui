'use client';
import * as React from 'react';
import { unstable_useForkRef as useForkRef } from '@mui/utils';
import { UseMenuTriggerParameters, UseMenuTriggerReturnValue } from './useMenuTrigger.types';
import { useButton } from '../../useButton/useButton';
import { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { ownerDocument } from '../../utils/owner';
/**
 *
 * API:
 *
 * - [useMenuTrigger API](https://mui.com/base-ui/api/use-menu-trigger/)
 */
export function useMenuTrigger(parameters: UseMenuTriggerParameters): UseMenuTriggerReturnValue {
  const {
    disabled = false,
    rootRef: externalRef,
    open,
    setOpen,
    setTriggerElement,
    menuEvents,
  } = parameters;

  const { getRootProps: getButtonRootProps, rootRef: buttonRootRef } = useButton({
    disabled,
    focusableWhenDisabled: false,
    rootRef: externalRef,
  });

  const handleRef = useForkRef(buttonRootRef, setTriggerElement);
  const ignoreNextClick = React.useRef(false);

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return mergeReactProps(
        externalProps,
        {
          'aria-haspopup': 'menu' as const,
          tabIndex: 0, // this is needed to make the button focused after click in Safari
          ref: handleRef,
          onMouseDown: (event: MouseEvent) => {
            if (open) {
              return;
            }

            // prevents closing the menu right after it was opened
            ignoreNextClick.current = true;
            event.preventDefault();

            setOpen(true, event);
            menuEvents.emit('click-and-drag:enabled', event);

            const mousedownTarget = event.target as Element;

            function handleDocumentMouseUp(mouseUpEvent: MouseEvent) {
              const mouseupTarget = mouseUpEvent.target as HTMLElement;
              if (mouseupTarget?.dataset?.handleMouseup === 'true') {
                mouseupTarget.click();
              }

              menuEvents.emit('click-and-drag:disabled', mouseUpEvent);
              ownerDocument(mousedownTarget).removeEventListener('mouseup', handleDocumentMouseUp);
            }

            ownerDocument(mousedownTarget).addEventListener('mouseup', handleDocumentMouseUp);
          },
          onClick: (event: MouseEvent) => {
            if (ignoreNextClick.current) {
              ignoreNextClick.current = false;
              return;
            }

            setOpen(!open, event);
          },
        },
        getButtonRootProps(),
      );
    },
    [getButtonRootProps, handleRef, open, menuEvents, setOpen],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      rootRef: handleRef,
    }),
    [getRootProps, handleRef],
  );
}

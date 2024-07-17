'use client';
import * as React from 'react';
import { FloatingEvents } from '@floating-ui/react';
import { useButton } from '../../useButton';
import { useForkRef } from '../../utils/useForkRef';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';

/**
 *
 * API:
 *
 * - [useMenuItem API](https://mui.com/base-ui/api/use-menu-item/)
 */
export function useMenuItem(params: useSubmenuTrigger.Parameters): useSubmenuTrigger.ReturnValue {
  const {
    closeOnClick,
    disabled = false,
    highlighted,
    id,
    menuEvents,
    rootRef: externalRef,
    clickAndDragEnabled,
  } = params;

  const { getRootProps: getButtonProps, rootRef: buttonRefHandler } = useButton({
    disabled,
    focusableWhenDisabled: true,
  });

  const handleRef = useForkRef(buttonRefHandler, externalRef);

  const getRootProps = React.useCallback(
    (externalProps?: GenericHTMLProps): GenericHTMLProps => {
      return mergeReactProps(
        externalProps,
        {
          ref: handleRef,
          'data-handle-mouseup': clickAndDragEnabled || undefined,
        },
        getButtonProps({
          id,
          role: 'menuitem',
          tabIndex: highlighted ? 0 : -1,
          onClick: (event: React.MouseEvent) => {
            if (closeOnClick) {
              menuEvents.emit('close', event);
            }
          },
        }),
      );
    },
    [closeOnClick, getButtonProps, handleRef, highlighted, id, menuEvents, clickAndDragEnabled],
  );

  return {
    getRootProps,
    rootRef: handleRef,
  };
}

namespace useSubmenuTrigger {
  export interface Parameters {
    closeOnClick: boolean;
    disabled: boolean;
    highlighted: boolean;
    id: string | undefined;
    menuEvents: FloatingEvents;
    rootRef?: React.Ref<Element>;
    clickAndDragEnabled: boolean;
  }

  export interface ReturnValue {
    /**
     * Resolver for the root slot's props.
     * @param externalProps event handlers for the root slot
     * @returns props that should be spread on the root slot
     */
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    /**
     * The ref to the component's root DOM element.
     */
    rootRef: React.RefCallback<Element> | null;
  }
}

'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useForkRef } from '../../utils/useForkRef';
import { GenericHTMLProps } from '../../utils/types';
import { useButton } from '../../useButton';

export function useCollapsibleTrigger(
  parameters: useCollapsibleTrigger.Parameters,
): useCollapsibleTrigger.ReturnValue {
  const { contentId, disabled, id, open, rootRef: externalRef, setOpen } = parameters;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    type: 'button',
  });

  const handleRef = useForkRef(externalRef, buttonRef);

  const getRootProps: useCollapsibleTrigger.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps: GenericHTMLProps = {}) =>
      mergeReactProps(
        externalProps,
        mergeReactProps(
          {
            type: 'button',
            'aria-controls': contentId,
            'aria-expanded': open,
            disabled,
            id,
            onClick() {
              setOpen(!open);
            },
            ref: handleRef,
          },
          getButtonProps(),
        ),
      ),
    [contentId, disabled, getButtonProps, handleRef, id, open, setOpen],
  );

  return {
    getRootProps,
  };
}

export namespace useCollapsibleTrigger {
  export interface Parameters {
    /**
     *  The id of the element controlled by the Trigger
     */
    contentId: React.HTMLAttributes<Element>['id'];
    disabled?: boolean;
    id?: React.HTMLAttributes<Element>['id'];
    /**
     * The open state of the Collapsible
     */
    open: boolean;
    rootRef?: React.Ref<Element>;
    /**
     * A state setter that sets the open state of the Collapsible
     */
    setOpen: (open: boolean) => void;
  }

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}

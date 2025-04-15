'use client';
import * as React from 'react';
import { mergeProps } from '../../merge-props';
import { useForkRef } from '../../utils/useForkRef';
import { GenericHTMLProps } from '../../utils/types';
import { useButton } from '../../use-button';

export function useCollapsibleTrigger(
  parameters: useCollapsibleTrigger.Parameters,
): useCollapsibleTrigger.ReturnValue {
  const { panelId, disabled, open, rootRef: externalRef, handleTrigger } = parameters;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
  });

  const handleRef = useForkRef(externalRef, buttonRef);

  const getRootProps: useCollapsibleTrigger.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps: GenericHTMLProps = {}) =>
      mergeProps(
        {
          'aria-controls': panelId,
          'aria-expanded': open,
          disabled,
          onClick: handleTrigger,
          ref: handleRef,
        },
        externalProps,
        getButtonProps,
      ),
    [panelId, disabled, getButtonProps, handleRef, open, handleTrigger],
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
    panelId: React.HTMLAttributes<Element>['id'];
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the collapsible panel is currently open.
     *
     * To render an uncontrolled collapsible, use the `defaultOpen` prop instead.
     */
    open: boolean;
    rootRef: React.Ref<Element>;
    handleTrigger: () => void;
  }

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}

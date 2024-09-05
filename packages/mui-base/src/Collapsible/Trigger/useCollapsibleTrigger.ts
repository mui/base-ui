'use client';

import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';

export function useCollapsibleTrigger(
  parameters: useCollapsibleTrigger.Parameters,
): useCollapsibleTrigger.ReturnValue {
  const { contentId, open, setOpen } = parameters;

  const getRootProps: useCollapsibleTrigger.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'button'>(externalProps, {
        type: 'button',
        'aria-controls': contentId,
        'aria-expanded': open,
        onClick() {
          setOpen(!open);
        },
      }),
    [contentId, open, setOpen],
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
    /**
     * The open state of the Collapsible
     */
    open: boolean;
    /**
     * A state setter that sets the open state of the Collapsible
     */
    setOpen: (open: boolean) => void;
  }

  export interface ReturnValue {
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'button'>,
    ) => React.ComponentPropsWithRef<'button'>;
  }
}

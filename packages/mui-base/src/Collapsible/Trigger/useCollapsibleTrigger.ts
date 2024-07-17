'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import {
  UseCollapsibleTriggerParameters,
  UseCollapsibleTriggerReturnValue,
} from './CollapsibleTrigger.types';
/**
 *
 * Demos:
 *
 * - [Collapsible](https://mui.com/base-ui/react-collapsible/#hooks)
 *
 * API:
 *
 * - [useCollapsibleTrigger API](https://mui.com/base-ui/react-collapsible/hooks-api/#use-collapsible-trigger)
 */
function useCollapsibleTrigger(
  parameters: UseCollapsibleTriggerParameters,
): UseCollapsibleTriggerReturnValue {
  const { contentId, open, setOpen } = parameters;

  const getRootProps: UseCollapsibleTriggerReturnValue['getRootProps'] = React.useCallback(
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

export { useCollapsibleTrigger };

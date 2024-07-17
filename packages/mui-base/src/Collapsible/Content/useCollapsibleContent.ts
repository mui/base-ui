'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useId } from '../../utils/useId';
import {
  UseCollapsibleContentParameters,
  UseCollapsibleContentReturnValue,
} from './CollapsibleContent.types';
/**
 *
 * Demos:
 *
 * - [Collapsible](https://mui.com/base-ui/react-collapsible/#hooks)
 *
 * API:
 *
 * - [useCollapsibleContent API](https://mui.com/base-ui/react-collapsible/hooks-api/#use-collapsible-content)
 */
function useCollapsibleContent(
  parameters: UseCollapsibleContentParameters,
): UseCollapsibleContentReturnValue {
  const { id: idParam, open, setContentId } = parameters;

  const id = useId(idParam);

  useEnhancedEffect(() => {
    setContentId(id);
    return () => {
      setContentId(undefined);
    };
  }, [id, setContentId]);

  const getRootProps: UseCollapsibleContentReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        id,
        hidden: open ? undefined : 'hidden',
      }),
    [id, open],
  );

  return {
    getRootProps,
  };
}

export { useCollapsibleContent };

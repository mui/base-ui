import * as React from 'react';
import type { ElementProps } from '@floating-ui/react';
import type { GenericHTMLProps } from './types';
import { mergeReactProps } from './mergeReactProps';

/**
 * Merges an array of interaction hooks' props into prop getters, allowing
 * event handler functions to be composed together without overwriting one
 * another.
 * @see https://floating-ui.com/docs/useInteractions
 */
export function useInteractions(propsList: Array<ElementProps>) {
  const referenceDeps = propsList.map((key) => key.reference);
  const floatingDeps = propsList.map((key) => key.floating);
  const itemDeps = propsList.map((key) => key.item);

  const getReferenceProps = React.useCallback(
    (userProps?: GenericHTMLProps) => mergeReactProps(userProps, propsList, 'reference'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    referenceDeps,
  );

  const getFloatingProps = React.useCallback(
    (userProps?: GenericHTMLProps) => mergeReactProps(userProps, propsList, 'floating'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    floatingDeps,
  );

  const getItemProps = React.useCallback(
    (userProps?: GenericHTMLProps & { selected?: boolean; active?: boolean }) =>
      mergeReactProps(userProps, propsList, 'item'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    itemDeps,
  );

  return React.useMemo(
    () => ({ getReferenceProps, getFloatingProps, getItemProps }),
    [getReferenceProps, getFloatingProps, getItemProps],
  );
}

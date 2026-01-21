import * as React from 'react';

import type { ElementProps } from '../types';
import { ACTIVE_KEY, FOCUSABLE_ATTRIBUTE, SELECTED_KEY } from '../utils/constants';

export type ExtendedUserProps = {
  [ACTIVE_KEY]?: boolean | undefined;
  [SELECTED_KEY]?: boolean | undefined;
};

export interface UseInteractionsReturn {
  getReferenceProps: (userProps?: React.HTMLProps<Element>) => Record<string, unknown>;
  getFloatingProps: (userProps?: React.HTMLProps<HTMLElement>) => Record<string, unknown>;
  getItemProps: (
    userProps?: Omit<React.HTMLProps<HTMLElement>, 'selected' | 'active'> & ExtendedUserProps,
  ) => Record<string, unknown>;
  getTriggerProps: (userProps?: React.HTMLProps<Element>) => Record<string, unknown>;
}

/**
 * Merges an array of interaction hooks' props into prop getters, allowing
 * event handler functions to be composed together without overwriting one
 * another.
 * @see https://floating-ui.com/docs/useInteractions
 */
export function useInteractions(propsList: Array<ElementProps | void> = []): UseInteractionsReturn {
  const referenceDeps = propsList.map((key) => key?.reference);
  const floatingDeps = propsList.map((key) => key?.floating);
  const itemDeps = propsList.map((key) => key?.item);
  const triggerDeps = propsList.map((key) => key?.trigger);

  const getReferenceProps = React.useCallback(
    (userProps?: React.HTMLProps<Element>) => mergeProps(userProps, propsList, 'reference'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    referenceDeps,
  );

  const getFloatingProps = React.useCallback(
    (userProps?: React.HTMLProps<HTMLElement>) => mergeProps(userProps, propsList, 'floating'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    floatingDeps,
  );

  const getItemProps = React.useCallback(
    (userProps?: Omit<React.HTMLProps<HTMLElement>, 'selected' | 'active'> & ExtendedUserProps) =>
      mergeProps(userProps, propsList, 'item'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    itemDeps,
  );

  const getTriggerProps = React.useCallback(
    (userProps?: React.HTMLProps<Element>) => mergeProps(userProps, propsList, 'trigger'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    triggerDeps,
  );

  return React.useMemo(
    () => ({ getReferenceProps, getFloatingProps, getItemProps, getTriggerProps }),
    [getReferenceProps, getFloatingProps, getItemProps, getTriggerProps],
  );
}

/* eslint-disable guard-for-in */

function mergeProps<Key extends keyof ElementProps>(
  userProps: (React.HTMLProps<Element> & ExtendedUserProps) | undefined,
  propsList: Array<ElementProps | void>,
  elementKey: Key,
): Record<string, unknown> {
  const eventHandlers = new Map<string, Array<(...args: unknown[]) => void>>();
  const isItem = elementKey === 'item';

  const outputProps = {} as Record<string, unknown>;

  if (elementKey === 'floating') {
    outputProps.tabIndex = -1;
    outputProps[FOCUSABLE_ATTRIBUTE] = '';
  }

  for (const key in userProps) {
    if (isItem && userProps) {
      if (key === ACTIVE_KEY || key === SELECTED_KEY) {
        continue;
      }
    }
    outputProps[key] = (userProps as any)[key];
  }

  for (let i = 0; i < propsList.length; i += 1) {
    let props;

    const propsOrGetProps = propsList[i]?.[elementKey];
    if (typeof propsOrGetProps === 'function') {
      props = userProps ? propsOrGetProps(userProps) : null;
    } else {
      props = propsOrGetProps;
    }
    if (!props) {
      continue;
    }

    mutablyMergeProps(outputProps, props, isItem, eventHandlers);
  }

  mutablyMergeProps(outputProps, userProps, isItem, eventHandlers);

  return outputProps;
}

function mutablyMergeProps(
  outputProps: Record<string, unknown>,
  props: any,
  isItem: boolean,
  eventHandlers: Map<string, Array<(...args: unknown[]) => void>>,
) {
  for (const key in props) {
    const value = (props as any)[key];

    if (isItem && (key === ACTIVE_KEY || key === SELECTED_KEY)) {
      continue;
    }

    if (!key.startsWith('on')) {
      outputProps[key] = value;
    } else {
      if (!eventHandlers.has(key)) {
        eventHandlers.set(key, []);
      }

      if (typeof value === 'function') {
        eventHandlers.get(key)?.push(value);

        outputProps[key] = (...args: unknown[]) => {
          return eventHandlers
            .get(key)
            ?.map((fn) => fn(...args))
            .find((val) => val !== undefined);
        };
      }
    }
  }
}

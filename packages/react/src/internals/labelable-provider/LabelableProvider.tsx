'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { HTMLProps } from '../types';
import { useBaseUiId } from '../useBaseUiId';
import { LabelableContext, useLabelableContext } from './LabelableContext';

export const LabelableProvider: React.FC<LabelableProvider.Props> = function LabelableProvider(
  props,
) {
  const defaultId = useBaseUiId();

  const [controlIdState, setControlIdState] = React.useState<string | null | undefined>(defaultId);
  const [labelId, setLabelId] = React.useState<string | undefined>();
  const [messageIds, setMessageIds] = React.useState<string[]>([]);

  // `undefined` only survives until the React 17 fallback id is assigned. Do not use `??`:
  // `null` deliberately suppresses `htmlFor`.
  const controlId = controlIdState === undefined ? defaultId : controlIdState;

  const registrationsRef = useRefWithInit(() => new Map<symbol, string | null>());

  const { messageIds: parentMessageIds } = useLabelableContext();

  const registerControlId = useStableCallback(
    (source: symbol, nextId: string | null | undefined) => {
      const registrations = registrationsRef.current;

      if (nextId === undefined) {
        registrations.delete(source);
      } else {
        registrations.set(source, nextId);
      }

      setControlIdState((prev) => {
        if (registrations.size === 0) {
          // A hidden subtree (React Activity, a re-suspending Suspense) destroys effects but keeps
          // its DOM, so preserve its selected control.
          return prev;
        }

        let nextControlId: string | null | undefined;

        for (const id of registrations.values()) {
          // Keep the current selection while it is still registered, so rapid unmount/remount
          // cycles don't churn it.
          if (prev !== undefined && id === prev) {
            return prev;
          }

          if (nextControlId === undefined) {
            nextControlId = id;
          }
        }

        return nextControlId;
      });
    },
  );

  const resetControlId = useStableCallback(() => {
    if (registrationsRef.current.size === 0) {
      setControlIdState(defaultId);
    }
  });

  const getDescriptionProps = React.useCallback(
    (externalProps: HTMLProps) => {
      const ids = externalProps['aria-describedby']
        ? externalProps['aria-describedby'].split(' ')
        : [];
      ids.push(...parentMessageIds, ...messageIds);

      return {
        ...externalProps,
        'aria-describedby': Array.from(new Set(ids)).join(' ') || undefined,
      };
    },
    [parentMessageIds, messageIds],
  );

  const contextValue: LabelableContext = React.useMemo(
    () => ({
      controlId,
      registerControlId,
      resetControlId,
      labelId,
      setLabelId,
      messageIds,
      setMessageIds,
      getDescriptionProps,
    }),
    [
      controlId,
      registerControlId,
      resetControlId,
      labelId,
      setLabelId,
      messageIds,
      setMessageIds,
      getDescriptionProps,
    ],
  );

  return (
    <LabelableContext.Provider value={contextValue}>{props.children}</LabelableContext.Provider>
  );
};

export interface LabelableProviderState {}

export interface LabelableProviderProps {
  children?: React.ReactNode;
}

export namespace LabelableProvider {
  export type State = LabelableProviderState;
  export type Props = LabelableProviderProps;
}

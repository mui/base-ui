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
  const [controlIdState, setControlIdState] = React.useState<string | undefined>(defaultId);
  const [labelId, setLabelId] = React.useState<string | undefined>();
  const [messageIds, setMessageIds] = React.useState<string[]>([]);

  // `undefined` only survives until the React 17 fallback id is assigned.
  const controlId = controlIdState ?? defaultId;

  const registrationsRef = useRefWithInit(() => new Map<symbol, string>());

  const { messageIds: parentMessageIds } = useLabelableContext();

  const registerControlId = useStableCallback((source: symbol, nextId: string | undefined) => {
    const registrations = registrationsRef.current;

    if (nextId === undefined) {
      registrations.delete(source);

      // A hidden subtree (React Activity, a re-suspending Suspense) destroys effects but keeps
      // its DOM, so an empty map is indistinguishable from a real unmount. Keep the selection
      // so a control that is still rendered stays paired with the label.
      if (registrations.size === 0) {
        return;
      }
    } else {
      registrations.set(source, nextId);
    }

    // Keep the previously selected id while it is still registered so an unrelated
    // registration doesn't steal the selection.
    setControlIdState((prev) => {
      if (registrations.size === 0) {
        return prev;
      }

      let nextControlId: string | undefined;

      for (const id of registrations.values()) {
        if (id === prev) {
          return prev;
        }

        if (nextControlId === undefined) {
          nextControlId = id;
        }
      }

      return nextControlId;
    });
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
      labelId,
      setLabelId,
      messageIds,
      setMessageIds,
      getDescriptionProps,
    }),
    [
      controlId,
      registerControlId,
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

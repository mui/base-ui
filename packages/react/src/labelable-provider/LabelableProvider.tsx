'use client';
import * as React from 'react';
import { error } from '@base-ui/utils/error';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { mergeProps } from '../merge-props';
import { HTMLProps } from '../utils/types';
import { useBaseUiId } from '../utils/useBaseUiId';
import { LabelableContext, useLabelableContext } from './LabelableContext';

/**
 * @internal
 */
export const LabelableProvider: React.FC<LabelableProvider.Props> = function LabelableProvider(
  props,
) {
  const defaultId = useBaseUiId();

  const [controlId, setControlIdState] = React.useState<string | null | undefined>(
    !props.initialControlId ? defaultId : props.initialControlId,
  );
  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);
  const [messageIds, setMessageIds] = React.useState<string[]>([]);
  const registrationsRef = useRefWithInit(() => new Map<symbol, string | null>());

  const { messageIds: parentMessageIds } = useLabelableContext();

  function flushControlId() {
    setControlIdState((prev) => {
      const registrations = registrationsRef.current;

      if (registrations.size === 0) {
        return undefined;
      }

      let nextControlId: string | null | undefined;

      for (const id of registrations.values()) {
        if (prev !== undefined && id === prev) {
          return prev;
        }

        if (nextControlId === undefined) {
          nextControlId = id;
        }
      }

      return nextControlId;
    });
  }

  const registerControlId = useStableCallback(
    (source: symbol, nextId: string | null | undefined) => {
      const registrations = registrationsRef.current;

      if (nextId === undefined) {
        registrations.delete(source);
      } else {
        registrations.set(source, nextId);
      }

      if (process.env.NODE_ENV !== 'production') {
        if (nextId !== undefined) {
          let firstId: string | null | undefined;
          let hasMultipleIds = false;

          for (const id of registrations.values()) {
            if (firstId === undefined) {
              firstId = id;
            } else if (id !== firstId) {
              hasMultipleIds = true;
              break;
            }
          }

          if (hasMultipleIds) {
            error(
              'Multiple labelable controls were rendered within the same <Field.Root>. ' +
                'This makes label associations ambiguous and can cause render loops. ' +
                'Ensure that <Field.Root> wraps a single control. ' +
                'For checkbox or radio groups, wrap each option in <Field.Item>. ' +
                'For a shared label across multiple controls, use <Fieldset.Root>.',
            );
          }
        }
      }

      // Only flush when registering, not when unregistering.
      // This prevents loops during rapid unmount/remount cycles (e.g. React Activity).
      // The next registration will pick up the correct state.
      if (nextId !== undefined) {
        flushControlId();
      }
    },
  );

  const getDescriptionProps = React.useCallback(
    (externalProps: HTMLProps) => {
      return mergeProps(
        { 'aria-describedby': parentMessageIds.concat(messageIds).join(' ') || undefined },
        externalProps,
      );
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

export interface LabelableProviderProps {
  initialControlId?: string | null | undefined;
  children?: React.ReactNode;
}

export namespace LabelableProvider {
  export type Props = LabelableProviderProps;
}

'use client';
import * as React from 'react';
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

  const [controlId, setControlId] = React.useState<string | null | undefined>(
    props.initialControlId === undefined ? defaultId : props.initialControlId,
  );
  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);
  const [messageIds, setMessageIds] = React.useState<string[]>([]);

  const { messageIds: parentMessageIds } = useLabelableContext();

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
      setControlId,
      labelId,
      setLabelId,
      messageIds,
      setMessageIds,
      getDescriptionProps,
    }),
    [controlId, setControlId, labelId, setLabelId, messageIds, setMessageIds, getDescriptionProps],
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

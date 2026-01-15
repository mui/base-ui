'use client';
import * as React from 'react';
import { NOOP } from '../utils/noop';
// import { mergeProps } from '../merge-props';
// import { HTMLProps } from '../utils/types';
// import { useBaseUiId } from '../utils/useBaseUiId';
import {
  FieldInteractionStateContext,
  useFieldInteractionStateContext,
} from './FieldInteractionStateContext';

const FieldInteractionStateProviderInner: React.FC<FieldInteractionStateProvider.Props> =
  function FieldInteractionStateProviderInner(props) {
    const [focused, setFocused] = React.useState(false);

    const contextValue: FieldInteractionStateContext = React.useMemo(
      () => ({
        focused,
        setFocused,
        state: {
          focused,
        },
      }),
      [focused, setFocused],
    );

    return (
      <FieldInteractionStateContext.Provider value={contextValue}>
        {props.children}
      </FieldInteractionStateContext.Provider>
    );
  };

export const FieldInteractionStateProvider: React.FC<FieldInteractionStateProvider.Props> =
  function FieldInteractionStateProvider(props) {
    const parentContext = useFieldInteractionStateContext();
    const hasParentContext = parentContext.setFocused !== NOOP;

    if (hasParentContext) {
      return <React.Fragment>{props.children}</React.Fragment>;
    }

    return (
      <FieldInteractionStateProviderInner>{props.children}</FieldInteractionStateProviderInner>
    );
  };

export interface FieldInteractionStateProviderProps {
  children?: React.ReactNode;
}

export namespace FieldInteractionStateProvider {
  export type Props = FieldInteractionStateProviderProps;
}

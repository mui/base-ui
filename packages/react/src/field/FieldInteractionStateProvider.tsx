'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { NOOP } from '../utils/noop';
// import { mergeProps } from '../merge-props';
// import { HTMLProps } from '../utils/types';
// import { useBaseUiId } from '../utils/useBaseUiId';
import {
  FieldInteractionStateContext,
  useFieldInteractionStateContext,
} from './FieldInteractionStateContext';
import type { FieldRoot } from './root/FieldRoot';

const FieldInteractionStateProviderInner: React.FC<FieldInteractionStateProvider.Props> =
  function FieldInteractionStateProviderInner(props) {
    const { children, touched: touchedProp, dirty: dirtyProp } = props;

    const [touchedState, setTouchedUnwrapped] = React.useState(false);
    const [dirtyState, setDirtyUnwrapped] = React.useState(false);
    const [filled, setFilled] = React.useState(false);
    const [focused, setFocused] = React.useState(false);

    const touched = touchedProp ?? touchedState;
    const dirty = dirtyProp ?? dirtyState;

    const markedDirtyRef = React.useRef(false);

    const setTouched: typeof setTouchedUnwrapped = useStableCallback((value) => {
      if (touchedProp !== undefined) {
        return;
      }
      setTouchedUnwrapped(value);
    });

    const setDirty: typeof setDirtyUnwrapped = useStableCallback((value) => {
      if (dirtyProp !== undefined) {
        return;
      }

      if (value) {
        markedDirtyRef.current = true;
      }
      setDirtyUnwrapped(value);
    });

    const contextValue: FieldInteractionStateContext = React.useMemo(
      () => ({
        touched,
        setTouched,
        dirty,
        setDirty,
        filled,
        setFilled,
        focused,
        setFocused,
        state: {
          touched,
          dirty,
          filled,
          focused,
        },
        markedDirtyRef,
      }),
      [touched, setTouched, dirty, setDirty, filled, setFilled, focused, setFocused],
    );

    return (
      <FieldInteractionStateContext.Provider value={contextValue}>
        {children}
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

    return <FieldInteractionStateProviderInner {...props} />;
  };

export interface FieldInteractionStateProviderProps extends Pick<
  FieldRoot.Props,
  'touched' | 'dirty'
> {
  children?: React.ReactNode;
}

export namespace FieldInteractionStateProvider {
  export type Props = FieldInteractionStateProviderProps;
}

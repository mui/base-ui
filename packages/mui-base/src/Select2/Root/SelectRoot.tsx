'use client';
import * as React from 'react';
import { useSelectRoot } from './useSelectRoot';
import { SelectRootContext } from './SelectRootContext';
import { SelectIndexContext } from './SelectIndexContext';

export const SelectRoot: SelectRoot = function SelectRoot<Value>(
  props: SelectRoot.Props<Value>,
): React.JSX.Element {
  const selectRoot = useSelectRoot<Value>(props);
  return (
    <SelectRootContext.Provider value={selectRoot.rootContext}>
      <SelectIndexContext.Provider value={selectRoot.indexContext}>
        {props.children}
      </SelectIndexContext.Provider>
    </SelectRootContext.Provider>
  );
};

namespace SelectRoot {
  export type Props<Value> = useSelectRoot.Parameters<Value>;

  export interface OwnerState {}
}

interface SelectRoot {
  <Value>(props: SelectRoot.Props<Value>): React.JSX.Element;
  propTypes?: any;
}

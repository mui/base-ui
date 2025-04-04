'use client';
import * as React from 'react';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import type { ToolbarItemMetadata } from './ToolbarRoot';

export function useToolbarRoot(): useToolbarRoot.ReturnValue {
  const [itemMap, setItemMap] = React.useState(
    () => new Map<Node, CompositeMetadata<ToolbarItemMetadata> | null>(),
  );

  const disabledIndices = React.useMemo(() => {
    const output: number[] = [];
    for (const itemMetadata of itemMap.values()) {
      if (itemMetadata?.index && !itemMetadata.focusableWhenDisabled) {
        output.push(itemMetadata.index);
      }
    }
    return output;
  }, [itemMap]);

  return React.useMemo(
    () => ({
      disabledIndices,
      setItemMap,
    }),
    [disabledIndices, setItemMap],
  );
}

export namespace useToolbarRoot {
  export interface ReturnValue {
    disabledIndices: number[];
    setItemMap: React.Dispatch<
      React.SetStateAction<Map<Node, CompositeMetadata<ToolbarItemMetadata> | null>>
    >;
  }
}

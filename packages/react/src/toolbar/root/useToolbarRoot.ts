'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps, Orientation } from '../../utils/types';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import type { ToolbarItemMetadata } from './ToolbarRoot';

export function useToolbarRoot(parameters: useToolbarRoot.Parameters): useToolbarRoot.ReturnValue {
  const { orientation } = parameters;

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

  const getRootProps = React.useCallback(
    (externalProps = {}): React.ComponentPropsWithRef<'div'> => {
      return mergeReactProps(externalProps, {
        'aria-orientation': orientation,
        role: 'toolbar',
      });
    },
    [orientation],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      disabledIndices,
      setItemMap,
    }),
    [getRootProps, disabledIndices, setItemMap],
  );
}

export namespace useToolbarRoot {
  export interface Parameters {
    disabled: boolean;
    /**
     * The component orientation.
     * @default 'horizontal'
     */
    orientation: Orientation;
  }

  export interface ReturnValue {
    /**
     * Resolver for the Toolbar component's props.
     * @param externalProps additional props for Toolbar.Root
     * @returns props that should be spread on Toolbar.Root
     */
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    disabledIndices: number[];
    setItemMap: React.Dispatch<
      React.SetStateAction<Map<Node, CompositeMetadata<ToolbarItemMetadata> | null>>
    >;
  }
}

'use client';
import * as React from 'react';
import { BaseUIComponentProps, Orientation as BaseOrientation, HTMLProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { CompositeRoot } from '../../composite/root/CompositeRoot';
import type { CompositeMetadata } from '../../composite/list/CompositeList';
import { ToolbarRootContext } from './ToolbarRootContext';

/**
 * A container for grouping a set of controls, such as buttons, toggle groups, or menus.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
export const ToolbarRoot = React.forwardRef(function ToolbarRoot(
  componentProps: ToolbarRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    cols = 1,
    disabled = false,
    loop = true,
    orientation = 'horizontal',
    className,
    render,
    ...elementProps
  } = componentProps;

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

  const rootProps: HTMLProps = React.useMemo(
    () => ({
      'aria-orientation': orientation,
      role: 'toolbar',
    }),
    [orientation],
  );

  const toolbarRootContext: ToolbarRootContext = React.useMemo(
    () => ({
      disabled,
      orientation,
      setItemMap,
    }),
    [disabled, orientation, setItemMap],
  );

  const state = React.useMemo(() => ({ disabled, orientation }), [disabled, orientation]);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [rootProps, elementProps],
  });

  return (
    <ToolbarRootContext.Provider value={toolbarRootContext}>
      <CompositeRoot
        cols={cols}
        disabledIndices={disabledIndices}
        loop={loop}
        onMapChange={setItemMap}
        orientation={orientation}
        render={element}
      />
    </ToolbarRootContext.Provider>
  );
});

export interface ToolbarItemMetadata {
  focusableWhenDisabled: boolean;
}

export namespace ToolbarRoot {
  export type Orientation = BaseOrientation;

  export type State = {
    disabled: boolean;
    orientation: Orientation;
  };

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The number of columns. When greater than 1, the toolbar is arranged into
     * a grid.
     * @default 1
     */
    cols?: number;
    disabled?: boolean;
    /**
     * The orientation of the toolbar.
     * @type Toolbar.Root.Orientation
     * @default 'horizontal'
     */
    orientation?: Orientation;
    /**
     * If `true`, using keyboard navigation will wrap focus to the other end of the toolbar once the end is reached.
     *
     * @default true
     */
    loop?: boolean;
  }
}

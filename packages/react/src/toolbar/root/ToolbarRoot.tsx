'use client';
import * as React from 'react';
import { BaseUIComponentProps, Orientation as BaseOrientation, HTMLProps } from '../../utils/types';
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
    disabled = false,
    loopFocus = true,
    orientation = 'horizontal',
    className,
    render,
    ...elementProps
  } = componentProps;

  const [itemMap, setItemMap] = React.useState(
    () => new Map<Node, CompositeMetadata<ToolbarRoot.ItemMetadata> | null>(),
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

  const toolbarRootContext: ToolbarRootContext = React.useMemo(
    () => ({
      disabled,
      orientation,
      setItemMap,
    }),
    [disabled, orientation, setItemMap],
  );

  const state: ToolbarRoot.State = { disabled, orientation };

  const defaultProps: HTMLProps = {
    'aria-orientation': orientation,
    role: 'toolbar',
  };

  return (
    <ToolbarRootContext.Provider value={toolbarRootContext}>
      <CompositeRoot
        render={render}
        className={className}
        state={state}
        refs={[forwardedRef]}
        props={[defaultProps, elementProps]}
        disabledIndices={disabledIndices}
        loopFocus={loopFocus}
        onMapChange={setItemMap}
        orientation={orientation}
      />
    </ToolbarRootContext.Provider>
  );
});

export interface ToolbarRootItemMetadata {
  focusableWhenDisabled: boolean;
}

export type ToolbarRootOrientation = BaseOrientation;

export interface ToolbarRootState {
  disabled: boolean;
  orientation: ToolbarRoot.Orientation;
}

export interface ToolbarRootProps extends BaseUIComponentProps<'div', ToolbarRoot.State> {
  disabled?: boolean | undefined;
  /**
   * The orientation of the toolbar.
   * @default 'horizontal'
   */
  orientation?: ToolbarRoot.Orientation | undefined;
  /**
   * If `true`, using keyboard navigation will wrap focus to the other end of the toolbar once the end is reached.
   *
   * @default true
   */
  loopFocus?: boolean | undefined;
}

export namespace ToolbarRoot {
  export type ItemMetadata = ToolbarRootItemMetadata;
  export type Orientation = ToolbarRootOrientation;
  export type State = ToolbarRootState;
  export type Props = ToolbarRootProps;
}

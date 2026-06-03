'use client';
import * as React from 'react';
import { isElementDisabled } from '@base-ui/utils/isElementDisabled';
import {
  BaseUIComponentProps,
  Orientation as BaseOrientation,
  HTMLProps,
} from '../../internals/types';
import { CompositeRoot } from '../../internals/composite/root/CompositeRoot';
import type { CompositeMetadata } from '../../internals/composite/list/CompositeList';
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
    style,
    ...elementProps
  } = componentProps;

  const [itemMap, setItemMap] = React.useState(
    () => new Map<Node, CompositeMetadata<ToolbarRoot.ItemMetadata> | null>(),
  );

  const disabledIndices = React.useMemo(() => {
    const output: number[] = [];
    for (const [node, itemMetadata] of itemMap) {
      const index = itemMetadata?.index;
      if (index == null) {
        continue;
      }

      if (hasToolbarRootItemMetadata(itemMetadata)) {
        // Only toolbar items that are disabled and not focusable when disabled
        // are removed from roving focus.
        if (itemMetadata.disabled && !itemMetadata.focusableWhenDisabled) {
          output.push(index);
        }
      } else if (isElementDisabled(node as HTMLElement)) {
        // Items without toolbar metadata, such as direct ToggleGroup > Toggle
        // children, still rely on their DOM disabled state.
        output.push(index);
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

  const state: ToolbarRootState = { disabled, orientation };

  const defaultProps: HTMLProps = {
    'aria-orientation': orientation,
    role: 'toolbar',
  };

  return (
    <ToolbarRootContext.Provider value={toolbarRootContext}>
      <CompositeRoot
        render={render}
        className={className}
        style={style}
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
  disabled: boolean;
  focusableWhenDisabled: boolean;
}

export type ToolbarRootOrientation = BaseOrientation;

export interface ToolbarRootState {
  /**
   * Whether the component is disabled.
   */
  disabled: boolean;
  /**
   * The component orientation.
   */
  orientation: ToolbarRoot.Orientation;
}

export interface ToolbarRootProps extends BaseUIComponentProps<'div', ToolbarRootState> {
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

function hasToolbarRootItemMetadata(
  itemMetadata: CompositeMetadata<ToolbarRoot.ItemMetadata> | null,
): itemMetadata is CompositeMetadata<ToolbarRoot.ItemMetadata> {
  return itemMetadata?.disabled != null && itemMetadata.focusableWhenDisabled != null;
}

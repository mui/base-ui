'use client';
import type * as React from 'react';
import {
  MenuPositioner,
  type MenuPositionerProps,
  type MenuPositionerState,
} from '../../menu/positioner/MenuPositioner';
import type { BaseUIComponentProps } from '../../internals/types';

export interface ContextMenuPositionerState extends MenuPositionerState {}

/**
 * Positions the context menu popup against the pointer or a custom anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 */
export const ContextMenuPositioner: React.ForwardRefExoticComponent<
  ContextMenuPositionerProps & React.RefAttributes<HTMLDivElement>
> = MenuPositioner;

export interface ContextMenuPositionerProps
  extends
    Omit<
      MenuPositionerProps,
      | keyof BaseUIComponentProps<'div', ContextMenuPositionerState>
      | 'anchor'
      | 'positionMethod'
      | 'sideOffset'
      | 'align'
      | 'alignOffset'
      | 'arrowPadding'
    >,
    BaseUIComponentProps<'div', ContextMenuPositionerState> {
  /**
   * An element to position the popup against.
   * By default, root context menus are positioned at the pointer, and submenus are positioned
   * against their trigger.
   */
  anchor?: MenuPositionerProps['anchor'] | undefined;
  /**
   * @ignore
   * @deprecated This prop has no effect on Context Menu.
   */
  positionMethod?: MenuPositionerProps['positionMethod'] | undefined;
  /**
   * Distance between the anchor and the popup in pixels.
   * Also accepts a function that returns the distance to read the dimensions of the anchor
   * and positioner elements, along with its side and alignment.
   *
   * The function takes a `data` object parameter with the following properties:
   * - `data.anchor`: the dimensions of the anchor element with properties `width` and `height`.
   * - `data.positioner`: the dimensions of the positioner element with properties `width` and `height`.
   * - `data.side`: which side of the anchor element the positioner is aligned against.
   * - `data.align`: how the positioner is aligned relative to the specified side.
   *
   * Defaults to `-5` for root context menus when `side` is not specified and `align` is not
   * `'center'`. Otherwise, it defaults to `0`.
   *
   * @example
   * ```jsx
   * <ContextMenu.Positioner
   *   sideOffset={({ side, anchor }) => {
   *     return side === 'top' || side === 'bottom' ? anchor.height : anchor.width;
   *   }}
   * />
   * ```
   */
  sideOffset?: MenuPositionerProps['sideOffset'] | undefined;
  /**
   * How to align the popup relative to the specified side.
   * @default 'start'
   */
  align?: MenuPositionerProps['align'] | undefined;
  /**
   * Additional offset along the alignment axis in pixels.
   * Also accepts a function that returns the offset to read the dimensions of the anchor
   * and positioner elements, along with its side and alignment.
   *
   * The function takes a `data` object parameter with the following properties:
   * - `data.anchor`: the dimensions of the anchor element with properties `width` and `height`.
   * - `data.positioner`: the dimensions of the positioner element with properties `width` and `height`.
   * - `data.side`: which side of the anchor element the positioner is aligned against.
   * - `data.align`: how the positioner is aligned relative to the specified side.
   *
   * Defaults to `2` for root context menus when `side` is not specified and `align` is not
   * `'center'`. Otherwise, it defaults to `0`.
   *
   * @example
   * ```jsx
   * <ContextMenu.Positioner
   *   alignOffset={({ side, anchor }) => {
   *     return side === 'top' || side === 'bottom' ? anchor.width : anchor.height;
   *   }}
   * />
   * ```
   */
  alignOffset?: MenuPositionerProps['alignOffset'] | undefined;
  /**
   * Minimum distance to maintain between the arrow and the edges of the popup.
   *
   * Root context menus always use `0`. Submenus default to `5`.
   */
  arrowPadding?: MenuPositionerProps['arrowPadding'] | undefined;
}

export namespace ContextMenuPositioner {
  export type Props = ContextMenuPositionerProps;
  export type State = ContextMenuPositionerState;
}

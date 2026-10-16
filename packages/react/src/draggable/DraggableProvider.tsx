'use client';

import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { createKind } from '../utils/drag-and-drop/dragKind';
import { PreviewOverlayRenderer } from '../utils/drag-and-drop/overlay/PreviewOverlayRenderer';
import { DraggableContext } from './DraggableContext';
import type { DraggableContextValue } from './DraggableContext';
import type { DraggableRootRecord } from './root/DraggableRoot';
import type { DraggableTargetRecord } from './target/DraggableTarget';

/**
 * Groups the drag sources, drop targets, and viewports of an interaction.
 * Required above the Draggable parts and `useManager`. Custom previews render inside it.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable#provider)
 */
export function DraggableProvider(props: DraggableProviderProps): React.ReactNode {
  const { children } = props;
  const contextValue = useRefWithInit<DraggableContextValue>(() => ({
    defaultKind: createKind<undefined>('default'),
  })).current;

  return (
    <DraggableContext.Provider value={contextValue}>
      {children}
      <PreviewOverlayRenderer />
    </DraggableContext.Provider>
  );
}

export interface DraggableProviderProps {
  /** The parts of the interaction. */
  children?: React.ReactNode | undefined;
}

/** Pointer device that initiated the drag. */
export type DraggablePointerType = 'mouse' | 'pen' | 'touch';

/** The pointer state at the moment a drag event fires. */
export interface DraggableInput {
  /**
   * The button that changed, as in `MouseEvent.button`: `0` primary, `1` middle, `2` secondary.
   * Move-derived events, such as `onMove` and `onTargetChange`, carry `-1`.
   * Read `buttons` for what is held mid-drag.
   */
  button: number;
  /** `MouseEvent.buttons` bitmask. */
  buttons: number;
  /** Pointer X relative to the viewport, in CSS pixels. */
  clientX: number;
  /** Pointer Y relative to the viewport, in CSS pixels. */
  clientY: number;
  /** Pointer X relative to the document, in CSS pixels (includes scroll). */
  pageX: number;
  /** Pointer Y relative to the document, in CSS pixels (includes scroll). */
  pageY: number;
  /** The pointer device that produced this input. */
  pointerType: DraggablePointerType;
  /** Whether the Control key was held. */
  ctrlKey: boolean;
  /** Whether the Shift key was held. */
  shiftKey: boolean;
  /** Whether the Alt key was held. */
  altKey: boolean;
  /** Whether the Meta (Command/Windows) key was held. */
  metaKey: boolean;
}

/** A 2D coordinate in CSS pixels. */
export interface DraggablePosition {
  x: number;
  y: number;
}

/**
 * The pointer state and the drop targets under the pointer at one moment.
 * The type of `location.initial`, `location.current`, and `location.previous`.
 */
export interface DraggableLocation {
  /** The pointer state. */
  input: DraggableInput;
  /** The drop targets under the pointer that accept the drag, innermost first. */
  targets: readonly DraggableTargetRecord[];
}

/** Where the drag is and has been, available as `eventDetails.location` in drag handlers. */
export interface DraggableLocationHistory {
  /** The pointer's offset from the source's top-left corner at pickup, in CSS pixels. */
  grabOffset: DraggablePosition;
  /** The location where the drag started. */
  initial: DraggableLocation;
  /** The location at the moment this event fires. */
  current: DraggableLocation;
  /**
   * The location at the previous event. On the first event of a drag, it holds the
   * pickup position and no drop targets.
   */
  previous: DraggableLocation;
}

// Type-only members that make a kind invariant in its type parameters. Their names make
// a mismatch error explain itself.
declare class DragKindPayload<TPayload, TDragData> {
  private payloadType: (payload: TPayload) => TPayload;
  private dragDataType: (dragData: TDragData) => TDragData;
}

/**
 * A kind of draggable item or drop target, created with `Draggable.createKind` or
 * `Draggable.createGlobalKind`. Its payload type types `source.payload` and `target.payload`
 * everywhere the kind is used. Without type arguments, `Draggable.Kind` fits any kind;
 * `Draggable.Kind<Card>` fits only the kinds whose payload is `Card`.
 */
// The type arguments default to `any` so an omitted one means "any kind". With invariant
// parameters, an `unknown` default would only match kinds declared with `unknown`.
export interface DraggableKind<in out TPayload = any, in out TDragData = any>
  extends DragKindPayload<TPayload, TDragData>, DraggableAcceptedKind<TPayload, TDragData> {}

/**
 * One or more kinds accepted by a drop target, viewport, or monitor.
 * They determine the type of `source.payload`.
 */
export type DraggableAccept<TPayload, TDragData = unknown> =
  | DraggableAcceptedKind<TPayload, TDragData>
  | ReadonlyArray<DraggableAcceptedKind<TPayload, TDragData>>;

/** A kind used to observe payloads, without declaring a payload under that kind. */
export interface DraggableAcceptedKind<TPayload = unknown, TDragData = unknown> {
  /** The name or global key the kind was created with. A debugging aid only. */
  readonly name: string;
  /**
   * The kind's identity. Unique per `createKind` call, and shared by `createGlobalKind`
   * calls with the same key.
   */
  readonly id: symbol;
  /** Whether a drag source is of this kind. Narrows its `payload` type. */
  matches(source: DraggableRootRecord<unknown>): source is DraggableRootRecord<TPayload, TDragData>;
  /** Whether a drop target is of this kind. Narrows its `payload` type. */
  matches(
    target: DraggableTargetRecord<unknown>,
  ): target is DraggableTargetRecord<TPayload, TDragData>;
}

export namespace DraggableProvider {
  export type Props = DraggableProviderProps;
}

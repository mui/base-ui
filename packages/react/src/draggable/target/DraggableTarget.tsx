'use client';
import * as React from 'react';
import { useDraggableContext } from '../DraggableContext';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { BaseUIComponentProps } from '../../internals/types';
import type { REASONS } from '../../internals/reasons';
import type {
  RegisterTargetParameters,
  DragParametersWithRequiredAccept,
} from '../../utils/drag-and-drop/registrationTypes';
import type {
  AcceptedDragPayload,
  AcceptedDragData,
  DragEventDetails,
  DropTargetChangeEventDetails,
  DropTargetEventValue,
  MoveEventDetails,
  MoveStartEventDetails,
} from '../../utils/drag-and-drop/types';
import type { DraggableAccept, DraggableKind, DraggableInput } from '../DraggableProvider';
import * as DraggableTargetDataAttributes from './DraggableTargetDataAttributes';
import { useDraggableTargetElement } from './useDraggableTargetElement';
import type { UseDraggableTargetElementParameters } from './useDraggableTargetElement';
import type { DraggableRootRecord } from '../root/DraggableRoot';

const stateAttributesMapping: StateAttributesMapping<DraggableTargetState> = {
  // The default mapping only lowercases the state key, which would yield
  // `data-dragoverinnermost`.
  dragOver: (value) => (value ? { [DraggableTargetDataAttributes.dragOver]: '' } : null),
  dragOverInnermost: (value) =>
    value ? { [DraggableTargetDataAttributes.dragOverInnermost]: '' } : null,
};

/**
 * An area where a matching draggable can be dropped.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable#drop-targets)
 */
export const DraggableTarget = React.forwardRef(function DraggableTarget<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
>(
  componentProps: Omit<DraggableTargetPropsBase<TSourcePayload, TTargetPayload>, 'accept'> & {
    /**
     * One or more kinds of draggable this target accepts. Defaults to the kind of the
     * nearest `<Draggable.Provider>`. Pass `Draggable.anyKind` to accept every drag,
     * with `source.payload` typed as `unknown`.
     *
     * Drags of other kinds ignore this target, but an ancestor target can still accept them.
     */
    accept?: DraggableAccept<TSourcePayload> | undefined;
    payload?: TTargetPayload | undefined;
  },
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    // Rendering props
    className,
    render,
    style,
    children,
    // Drop target props. Listed explicitly because whatever stays in
    // `elementProps` is spread onto the `<div>`, where an engine parameter would
    // land as an attribute.
    kind,
    accept,
    canDrop,
    disabled,
    payload,
    snap,
    trackDragOver,
    // Event handlers
    onDraggableStart,
    onDraggableMove,
    onDraggableEnter,
    onDraggableLeave,
    onDraggableDrop,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  // A fresh object per render is fine: `useDraggableTargetElement` reads it through a
  // ref and never compares it.
  const { defaultKind } = useDraggableContext();
  const params = {
    kind,
    accept: accept ?? defaultKind,
    canDrop,
    disabled,
    payload,
    snap,
    trackDragOver,
    onDraggableStart,
    onDraggableMove,
    onDraggableEnter,
    onDraggableLeave,
    onDraggableDrop,
  } as UseDraggableTargetElementParameters;

  const { ref, dragOver, dragOverInnermost, rejected, accepting } =
    useDraggableTargetElement(params);

  const state: DraggableTarget.State = {
    dragOver,
    dragOverInnermost,
    rejected,
    accepting,
    disabled: disabled ?? false,
  };

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, ref],
    props: [{ children }, elementProps],
    stateAttributesMapping,
  });
  // Overloaded, unlike `Draggable.Root`, so a declared `TTargetPayload` can't omit `payload`
  // and leave `target.payload` typed while the engine delivers `undefined`.
  // The fallback's target payload is `undefined`, not `unknown`: `kind` is typed from it,
  // so a payload-carrying `kind={column}` with no `payload` is rejected here rather
  // than compiling with `column.matches(target)` narrowing to a payload that is
  // `undefined` at runtime.
}) as {
  <TTargetDragData = unknown>(
    props: DraggableTargetProps<undefined, undefined, unknown, TTargetDragData>,
  ): React.JSX.Element;
  <
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TSourceDragData = unknown,
    TTargetDragData = unknown,
  >(
    props: DraggableTargetPropsBase<
      TSourcePayload,
      TTargetPayload,
      TSourceDragData,
      TTargetDragData
    > & { kind?: undefined; payload: TTargetPayload },
  ): React.JSX.Element;
  <
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TSourceDragData = unknown,
    TTargetDragData = unknown,
  >(
    props: Omit<
      DraggableTargetPropsBase<TSourcePayload, TTargetPayload, TSourceDragData, TTargetDragData>,
      'kind'
    > & {
      kind?: DraggableKind<TTargetPayload, TTargetDragData> | undefined;
      payload: NoInfer<TTargetPayload>;
    },
  ): React.JSX.Element;
  <TSourcePayload = unknown, TSourceDragData = unknown, TTargetDragData = unknown>(
    props: DraggableTargetPropsBase<TSourcePayload, undefined, TSourceDragData, TTargetDragData> & {
      payload?: undefined;
    },
  ): React.JSX.Element;
  <TAccept extends DraggableAccept<unknown>, TTargetPayload>(
    props: DragParametersWithRequiredAccept<
      DraggableTargetPropsBase<
        AcceptedDragPayload<TAccept>,
        TTargetPayload,
        AcceptedDragData<TAccept>
      >,
      TAccept
    > & { kind?: undefined; payload: TTargetPayload },
  ): React.JSX.Element;
  <TAccept extends DraggableAccept<unknown>, TTargetPayload, TTargetDragData = unknown>(
    props: DragParametersWithRequiredAccept<
      Omit<
        DraggableTargetPropsBase<
          AcceptedDragPayload<TAccept>,
          TTargetPayload,
          AcceptedDragData<TAccept>,
          TTargetDragData
        >,
        'kind'
      >,
      TAccept
    > & { kind: DraggableKind<TTargetPayload, TTargetDragData>; payload: NoInfer<TTargetPayload> },
  ): React.JSX.Element;
  <TAccept extends DraggableAccept<unknown>, TTargetDragData = unknown>(
    props: DragParametersWithRequiredAccept<
      DraggableTargetPropsBase<
        AcceptedDragPayload<TAccept>,
        undefined,
        AcceptedDragData<TAccept>,
        TTargetDragData
      >,
      TAccept
    > & { payload?: undefined },
  ): React.JSX.Element;
};

export interface DraggableTargetState {
  /**
   * Whether a matching drag is over this target or one of its nested targets.
   * Always `false` when `trackDragOver` is `false`.
   */
  dragOver: boolean;
  /**
   * Whether this target accepts the drag in progress, regardless of the pointer position.
   * Based on `accept` alone, so `canDrop` can still refuse the drop.
   * Always `false` when `trackDragOver` is `false`.
   */
  accepting: boolean;
  /**
   * Whether this is the innermost target under the pointer, the one that would receive the drop.
   * Always `false` when `trackDragOver` is `false`.
   */
  dragOverInnermost: boolean;
  /**
   * Whether `canDrop` returned `'reject'` for the current position.
   * Always `false` when `trackDragOver` is `false`.
   */
  rejected: boolean;
  /** Whether the drop target is disabled. */
  disabled: boolean;
}

type DraggableTargetPropsBase<
  TSourcePayload,
  TTargetPayload,
  TSourceDragData = unknown,
  TTargetDragData = unknown,
> = BaseUIComponentProps<'div', DraggableTargetState> &
  Omit<
    RegisterTargetParameters<TSourcePayload, TTargetPayload, TSourceDragData, TTargetDragData>,
    'payload'
  > & {
    /**
     * Whether to track the drag-over state and expose it through data attributes.
     * Disable it on targets that don't use them to avoid re-rendering as the drag moves.
     * @default true
     */
    trackDragOver?: boolean | undefined;
  };

type DraggableTargetPayloadField<TTargetPayload> = [TTargetPayload] extends [undefined]
  ? { payload?: undefined }
  : { payload: NoInfer<TTargetPayload> };

export type DraggableTargetProps<
  TSourcePayload = undefined,
  TTargetPayload = undefined,
  TSourceDragData = unknown,
  TTargetDragData = unknown,
> = Omit<
  DraggableTargetPropsBase<TSourcePayload, TTargetPayload, TSourceDragData, TTargetDragData>,
  'accept'
> &
  DraggableTargetPayloadField<TTargetPayload> &
  ([TSourcePayload, TTargetPayload] extends [undefined, undefined]
    ? { accept?: DraggableAccept<TSourcePayload, TSourceDragData> | undefined }
    : { accept: DraggableAccept<TSourcePayload, TSourceDragData> });

/**
 * Where the pointer is within a drop target, as a fraction of its size:
 * `0` at the left or top edge, `1` at the right or bottom edge.
 */
export interface DraggableTargetLocalPoint {
  x: number;
  y: number;
}

/**
 * The number of equal steps a drop target is divided into on each axis, for
 * `getSnappedLocalPoint()`. An omitted axis isn't snapped. Steps don't depend on
 * the target's size, so `{ y: 96 }` splits a day column into 15-minute slots at any height.
 */
export interface DraggableTargetSnapSteps {
  x?: number | undefined;
  y?: number | undefined;
}

/** Options for `getSnappedLocalPoint()` on a drop target record. */
export interface DraggableTargetSnappedLocalPointOptions {
  /**
   * The point to snap: the pointer position, or the dragged element's top-left corner.
   * Use `'source'` when committing where the element lands.
   * @default 'pointer'
   */
  anchor?: 'pointer' | 'source' | undefined;
}

/** A drop target under the pointer. */
export interface DraggableTargetRecord<TTargetPayload = unknown, TDragData = unknown> {
  /** The drop target's own DOM element. */
  element: Element;
  /**
   * The identity of the target's `kind`, or `undefined` when it has none.
   * Test it with a kind's `matches` method, which also narrows `payload`.
   */
  kind: symbol | undefined;
  /**
   * The target's `payload`, or `undefined` when it has none.
   */
  readonly payload: TTargetPayload;
  /** Replaces the payload until the `payload` prop changes. */
  updatePayload(payload: TTargetPayload): void;
  /** Data stored for this target during the current drag. Starts as `undefined`. */
  readonly dragData: TDragData | undefined;
  /** Stores data for this target for the rest of the current drag. */
  updateDragData(dragData: TDragData): void;
  /**
   * Returns where the pointer is within this target, as a fraction of its size on
   * each axis: `0` at the left or top edge, `1` at the right or bottom edge.
   * Use it when a drop means a value spread across the target, such as a time in a day column:
   *
   * ```tsx
   * <Draggable.Target
   *   accept={eventKind}
   *   onDraggableDrop={({ target }) => {
   *     schedule(target.getLocalPoint().y * MINUTES_PER_DAY);
   *   }}
   * />
   * ```
   *
   * The value isn't clamped, since an outer target can have the pointer outside its
   * own box while a nested target is under it. A target with no size reports `0` on both axes.
   */
  getLocalPoint: () => DraggableTargetLocalPoint;
  /**
   * Returns `getLocalPoint()` rounded to the target's `snap` steps and clamped between `0` and `1`:
   *
   * ```tsx
   * <Draggable.Target
   *   accept={eventKind}
   *   snap={{ y: 96 }}
   *   onDraggableDrop={({ source, target }) => {
   *     // Already a multiple of 15 minutes.
   *     schedule(source.payload.id, target.getSnappedLocalPoint().y * MINUTES_PER_DAY);
   *   }}
   * />
   * ```
   *
   * Pass `{ anchor: 'source' }` to snap the dragged element's top-left corner instead
   * of the pointer. An axis without steps returns its clamped fraction.
   */
  getSnappedLocalPoint: (
    options?: DraggableTargetSnappedLocalPointOptions,
  ) => DraggableTargetLocalPoint;
}

/** The argument of a drop target's `canDrop` and `snap` functions. */
export interface DraggableTargetResolutionContext<TSourcePayload = unknown, TDragData = unknown> {
  /** The current pointer state. */
  input: DraggableInput;
  /** The item being dragged. */
  source: DraggableRootRecord<TSourcePayload, TDragData>;
  /** The drop target's own DOM element. */
  element: Element;
}

export interface DraggableTargetStartValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> extends DropTargetEventValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData> {}

export type DraggableTargetStartEventDetails = MoveStartEventDetails;

export type DraggableTargetStartEventReason = DraggableTargetStartEventDetails['reason'];

export interface DraggableTargetMoveValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> extends DropTargetEventValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData> {}

export type DraggableTargetMoveEventDetails = MoveEventDetails;

export type DraggableTargetMoveEventReason = DraggableTargetMoveEventDetails['reason'];

export interface DraggableTargetEnterValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> extends DropTargetEventValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData> {}

export type DraggableTargetEnterEventDetails = DropTargetChangeEventDetails;

export type DraggableTargetEnterEventReason = DraggableTargetEnterEventDetails['reason'];

export interface DraggableTargetLeaveValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> extends DropTargetEventValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData> {}

export type DraggableTargetLeaveEventDetails = DropTargetChangeEventDetails;

export type DraggableTargetLeaveEventReason = DraggableTargetLeaveEventDetails['reason'];

export interface DraggableTargetDropValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> extends DropTargetEventValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData> {}

// An interface so the API reference prints its name instead of expanding it.
export interface DraggableTargetDropEventDetails extends DragEventDetails<DraggableTargetDropEventReason> {}

export type DraggableTargetDropEventReason = typeof REASONS.drop;

export namespace DraggableTarget {
  export type SnapSteps = DraggableTargetSnapSteps;
  export type LocalPoint = DraggableTargetLocalPoint;
  export type SnappedLocalPointOptions = DraggableTargetSnappedLocalPointOptions;
  export type Record<TTargetPayload = unknown, TDragData = unknown> = DraggableTargetRecord<
    TTargetPayload,
    TDragData
  >;
  export type ResolutionContext<
    TSourcePayload = unknown,
    TDragData = unknown,
  > = DraggableTargetResolutionContext<TSourcePayload, TDragData>;
  export type StartValue<
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TDragData = unknown,
    TTargetDragData = unknown,
  > = DraggableTargetStartValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;
  export type StartEventDetails = DraggableTargetStartEventDetails;
  export type StartEventReason = DraggableTargetStartEventReason;
  export type MoveValue<
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TDragData = unknown,
    TTargetDragData = unknown,
  > = DraggableTargetMoveValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;
  export type MoveEventDetails = DraggableTargetMoveEventDetails;
  export type MoveEventReason = DraggableTargetMoveEventReason;
  export type EnterValue<
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TDragData = unknown,
    TTargetDragData = unknown,
  > = DraggableTargetEnterValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;
  export type EnterEventDetails = DraggableTargetEnterEventDetails;
  export type EnterEventReason = DraggableTargetEnterEventReason;
  export type LeaveValue<
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TDragData = unknown,
    TTargetDragData = unknown,
  > = DraggableTargetLeaveValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;
  export type LeaveEventDetails = DraggableTargetLeaveEventDetails;
  export type LeaveEventReason = DraggableTargetLeaveEventReason;
  export type DropValue<
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TDragData = unknown,
    TTargetDragData = unknown,
  > = DraggableTargetDropValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;
  export type DropEventDetails = DraggableTargetDropEventDetails;
  export type DropEventReason = DraggableTargetDropEventReason;
  export type State = DraggableTargetState;
  export type Props<
    TSourcePayload = undefined,
    TTargetPayload = undefined,
    TSourceDragData = unknown,
    TTargetDragData = unknown,
  > = DraggableTargetProps<TSourcePayload, TTargetPayload, TSourceDragData, TTargetDragData>;
}

'use client';
import * as React from 'react';
import { warn } from '@base-ui/utils/warn';
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
  DragDropEventDetails,
  DragMoveReason,
  DragStartReason,
  DropTargetChangeReason,
  DropTargetEventDetails,
  DropTargetLeaveEventDetails,
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
    // Documented on the public props below. This implementation signature is
    // replaced by the overloads, so its docs never ship.
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

  const context = useDraggableContext();
  /* istanbul ignore else -- `process.env.NODE_ENV` is a build-time constant under test */
  if (process.env.NODE_ENV !== 'production') {
    // `kind` is what this target is, and `accept` is what it takes. Mistaking one for
    // the other compiles, and the omitted `accept` falls back to the provider's
    // default kind, so the target silently ignores the sources it was meant for.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (kind !== undefined && accept === undefined) {
        warn(
          'A Draggable.Target has a `kind` but no `accept`, so it only takes drags of its ' +
            "provider's default kind. `kind` is what this target is; `accept` is which sources it takes. " +
            'Add `accept` with the kinds this target should receive. ' +
            'See https://base-ui.com/react/utils/draggable#accepting-drops.',
        );
      }
    }, [kind, accept]);
  }
  // A new object per render is fine, because `useDraggableTargetElement` reads it
  // through a ref and never compares it.
  const params = {
    kind,
    accept: accept ?? context.defaultKind,
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
    props: elementProps,
    stateAttributesMapping,
  });
  // Overloaded, unlike `Draggable.Root`, so a declared `TTargetPayload` can't omit `payload`
  // and leave `currentTarget.payload` typed while the engine delivers `undefined`.
  // The fallback's target payload is `undefined`, not `unknown`, because `kind` is typed
  // from it. A payload-carrying `kind={column}` with no `payload` is then rejected here.
  // Otherwise it would compile, and `column.matches(target)` would narrow to a payload
  // that is `undefined` at runtime.
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

// `payload` and `accept` repeat their JSDoc in each branch. The API reference reads
// the description of the first overload's members, which come from these branches.
export type DraggableTargetProps<
  TSourcePayload = undefined,
  TTargetPayload = undefined,
  TSourceDragData = unknown,
  TTargetDragData = unknown,
> = Omit<
  DraggableTargetPropsBase<TSourcePayload, TTargetPayload, TSourceDragData, TTargetDragData>,
  'accept'
> &
  ([TTargetPayload] extends [undefined]
    ? {
        /**
         * The data attached to this target, available as `eventDetails.currentTarget.payload`
         * in its handlers and on its record in `location.current.targets`.
         */
        payload?: undefined;
      }
    : {
        /**
         * The data attached to this target, available as `eventDetails.currentTarget.payload`
         * in its handlers and on its record in `location.current.targets`.
         */
        payload: NoInfer<TTargetPayload>;
      }) &
  ([TSourcePayload, TTargetPayload] extends [undefined, undefined]
    ? {
        /**
         * One or more kinds of draggable this target accepts. Defaults to the kind of the
         * nearest `<Draggable.Provider>`. Pass `Draggable.anyKind` to accept every drag,
         * with `source.payload` typed as `unknown`.
         *
         * Drags of other kinds ignore this target, but an ancestor target can still accept them.
         */
        accept?: DraggableAccept<TSourcePayload, TSourceDragData> | undefined;
      }
    : {
        /**
         * One or more kinds of draggable this target accepts. Pass `Draggable.anyKind` to
         * accept every drag, with `source.payload` typed as `unknown`.
         *
         * Drags of other kinds ignore this target, but an ancestor target can still accept them.
         */
        accept: DraggableAccept<TSourcePayload, TSourceDragData>;
      });

/**
 * Where the pointer is within a drop target, as a fraction of its size.
 * `0` is the left or top edge, and `1` is the right or bottom edge.
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
   * each axis. `0` is the left or top edge, and `1` is the right or bottom edge.
   * Use it when a drop means a value spread across the target, such as a time in a day column:
   *
   * ```tsx
   * <Draggable.Target
   *   accept={eventKind}
   *   onDraggableDrop={(eventDetails) => {
   *     schedule(eventDetails.currentTarget.getLocalPoint().y * MINUTES_PER_DAY);
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
   *   onDraggableDrop={(eventDetails) => {
   *     // Already a multiple of 15 minutes.
   *     const { y } = eventDetails.currentTarget.getSnappedLocalPoint();
   *     schedule(eventDetails.source.payload.id, y * MINUTES_PER_DAY);
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
  /**
   * Returns where the pointer is within the target, as in the target record's
   * `getLocalPoint()`, so `canDrop` can accept only part of the target.
   */
  getLocalPoint: () => DraggableTargetLocalPoint;
  /**
   * Returns the local point rounded to the target's `snap` steps, as in the target
   * record's `getSnappedLocalPoint()`. A `snap` callback that calls it gets the point
   * without snapping.
   */
  getSnappedLocalPoint: (
    options?: DraggableTargetSnappedLocalPointOptions,
  ) => DraggableTargetLocalPoint;
}

export type DraggableTargetStartEventDetails<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = DropTargetEventDetails<
  DragStartReason,
  TSourcePayload,
  TTargetPayload,
  TDragData,
  TTargetDragData
>;

export type DraggableTargetStartEventReason = DraggableTargetStartEventDetails['reason'];

export type DraggableTargetMoveEventDetails<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = DropTargetEventDetails<
  DragMoveReason,
  TSourcePayload,
  TTargetPayload,
  TDragData,
  TTargetDragData
>;

export type DraggableTargetMoveEventReason = DraggableTargetMoveEventDetails['reason'];

export type DraggableTargetEnterEventDetails<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = DropTargetEventDetails<
  DropTargetChangeReason,
  TSourcePayload,
  TTargetPayload,
  TDragData,
  TTargetDragData
>;

export type DraggableTargetEnterEventReason = DraggableTargetEnterEventDetails['reason'];

export type DraggableTargetLeaveEventDetails<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = DropTargetLeaveEventDetails<
  DropTargetChangeReason,
  TSourcePayload,
  TTargetPayload,
  TDragData,
  TTargetDragData
>;

export type DraggableTargetLeaveEventReason = DraggableTargetLeaveEventDetails['reason'];

// An interface so the API reference prints its name instead of expanding it.
export interface DraggableTargetDropEventDetails<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> extends DragDropEventDetails<TSourcePayload, TTargetPayload, TDragData, TTargetDragData> {}

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
  export type StartEventDetails<
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TDragData = unknown,
    TTargetDragData = unknown,
  > = DraggableTargetStartEventDetails<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;
  export type StartEventReason = DraggableTargetStartEventReason;
  export type MoveEventDetails<
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TDragData = unknown,
    TTargetDragData = unknown,
  > = DraggableTargetMoveEventDetails<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;
  export type MoveEventReason = DraggableTargetMoveEventReason;
  export type EnterEventDetails<
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TDragData = unknown,
    TTargetDragData = unknown,
  > = DraggableTargetEnterEventDetails<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;
  export type EnterEventReason = DraggableTargetEnterEventReason;
  export type LeaveEventDetails<
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TDragData = unknown,
    TTargetDragData = unknown,
  > = DraggableTargetLeaveEventDetails<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;
  export type LeaveEventReason = DraggableTargetLeaveEventReason;
  export type DropEventDetails<
    TSourcePayload = unknown,
    TTargetPayload = unknown,
    TDragData = unknown,
    TTargetDragData = unknown,
  > = DraggableTargetDropEventDetails<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;
  export type DropEventReason = DraggableTargetDropEventReason;
  export type State = DraggableTargetState;
  export type Props<
    TSourcePayload = undefined,
    TTargetPayload = undefined,
    TSourceDragData = unknown,
    TTargetDragData = unknown,
  > = DraggableTargetProps<TSourcePayload, TTargetPayload, TSourceDragData, TTargetDragData>;
}

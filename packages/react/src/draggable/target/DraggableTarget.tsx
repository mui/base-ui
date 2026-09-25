'use client';
import * as React from 'react';
import { useDraggableContext } from '../DraggableContext';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { BaseUIComponentProps } from '../../internals/types';
import type {
  RegisterTargetParameters,
  DragParametersWithRequiredAccept,
} from '../../types/dragRegistration';
import type {
  DropTargetEventDetailsMap,
  DropTargetEventValue,
  AcceptedDragPayload,
  AcceptedDragData,
  AnyDragAccept,
  DragAccept,
  DragKind,
  DraggableTargetRecord as DraggableTargetRecordType,
  DraggableTargetResolutionContext as DraggableTargetResolutionContextType,
  DropTargetPayload,
} from '../../types/drag';
import * as DraggableTargetDataAttributes from './DraggableTargetDataAttributes';
import { useDraggableTargetElement } from './useDraggableTargetElement';
import type { UseDraggableTargetElementParameters } from './useDraggableTargetElement';

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
    accept?: DragAccept<TSourcePayload> | undefined;
    payload?: DropTargetPayload<TTargetPayload> | undefined;
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
  // Overloaded like `Draggable.Root` so a declared `TTargetPayload` can't omit `payload`
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
      kind?: DragKind<TTargetPayload, TTargetDragData> | undefined;
      payload: NoInfer<TTargetPayload>;
    },
  ): React.JSX.Element;
  <TSourcePayload = unknown, TSourceDragData = unknown, TTargetDragData = unknown>(
    props: DraggableTargetPropsBase<TSourcePayload, undefined, TSourceDragData, TTargetDragData> & {
      payload?: undefined;
    },
  ): React.JSX.Element;
  <TAccept extends AnyDragAccept, TTargetPayload>(
    props: DragParametersWithRequiredAccept<
      DraggableTargetPropsBase<
        AcceptedDragPayload<TAccept>,
        TTargetPayload,
        AcceptedDragData<TAccept>
      >,
      TAccept
    > & { kind?: undefined; payload: TTargetPayload },
  ): React.JSX.Element;
  <TAccept extends AnyDragAccept, TTargetPayload, TTargetDragData = unknown>(
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
    > & { kind: DragKind<TTargetPayload, TTargetDragData>; payload: NoInfer<TTargetPayload> },
  ): React.JSX.Element;
  <TAccept extends AnyDragAccept, TTargetDragData = unknown>(
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
  : { payload: DropTargetPayload<NoInfer<TTargetPayload>> };

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
    ? { accept?: DragAccept<TSourcePayload, TSourceDragData> | undefined }
    : { accept: DragAccept<TSourcePayload, TSourceDragData> });

/** A drop target under the pointer. */
export type DraggableTargetRecord<
  TTargetPayload = unknown,
  TDragData = unknown,
> = DraggableTargetRecordType<TTargetPayload, TDragData>;
/** The argument of a drop target's `canDrop` and `snap` functions. */
export type DraggableTargetResolutionContext<
  TSourcePayload = unknown,
  TDragData = unknown,
> = DraggableTargetResolutionContextType<TSourcePayload, TDragData>;

export type DraggableTargetStartValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = DropTargetEventValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;
export type DraggableTargetStartEventDetails = DropTargetEventDetailsMap['onDraggableStart'];
export type DraggableTargetStartEventReason = DraggableTargetStartEventDetails['reason'];
export type DraggableTargetMoveValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = DropTargetEventValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;
export type DraggableTargetMoveEventDetails = DropTargetEventDetailsMap['onDraggableMove'];
export type DraggableTargetMoveEventReason = DraggableTargetMoveEventDetails['reason'];
export type DraggableTargetEnterValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = DropTargetEventValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;
export type DraggableTargetEnterEventDetails = DropTargetEventDetailsMap['onDraggableEnter'];
export type DraggableTargetEnterEventReason = DraggableTargetEnterEventDetails['reason'];
export type DraggableTargetLeaveValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = DropTargetEventValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;
export type DraggableTargetLeaveEventDetails = DropTargetEventDetailsMap['onDraggableLeave'];
export type DraggableTargetLeaveEventReason = DraggableTargetLeaveEventDetails['reason'];
export type DraggableTargetDropValue<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
> = DropTargetEventValue<TSourcePayload, TTargetPayload, TDragData, TTargetDragData>;
export type DraggableTargetDropEventDetails = DropTargetEventDetailsMap['onDraggableDrop'];
export type DraggableTargetDropEventReason = DraggableTargetDropEventDetails['reason'];

export namespace DraggableTarget {
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

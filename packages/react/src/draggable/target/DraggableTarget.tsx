'use client';
import * as React from 'react';
import { useDraggableContext } from '../DraggableContext';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { BaseUIComponentProps } from '../../internals/types';
import type {
  RegisterDropTargetParameters,
  DragParametersWithOptionalPayload,
  DragParametersWithRequiredPayload,
  DragParametersWithRequiredAccept,
} from '../../types/dragRegistration';
import type {
  AcceptedDragPayload,
  AnyDragAccept,
  DragAccept,
  DragKind,
  DropTargetPayload,
  DropTargetPayloadGetter,
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
 * Makes its element a drop target, so matching drag sources can be released on it.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable#drop-targets)
 */
export const DraggableTarget = React.forwardRef(function DraggableTarget<
  TSourceData = unknown,
  TLocalData = unknown,
>(
  componentProps: Omit<DraggableTargetPropsBase<TSourceData, TLocalData>, 'accept'> & {
    accept?: DragAccept<TSourceData> | undefined;
    payload?: DropTargetPayload<TLocalData> | undefined;
    getPayload?: DropTargetPayloadGetter<TSourceData, TLocalData> | undefined;
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
    getPayload,
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
    getPayload,
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
  // Overloaded like `Draggable.Root` so a declared `TLocalData` can't omit `payload`
  // and leave `target.payload` typed while the engine delivers `undefined`.
  // The fallback's local data is `undefined`, not `unknown`: `kind` is typed from it,
  // so a payload-carrying `kind={column}` with no `payload` is rejected here rather
  // than compiling with `column.matches(target)` narrowing to a payload that is
  // `undefined` at runtime.
}) as {
  (
    props: Omit<DraggableTargetPropsBase<undefined, undefined>, 'accept'> &
      DragParametersWithOptionalPayload<DropTargetPayloadParameters<undefined, undefined>> & {
        accept?: DragAccept<undefined> | undefined;
      },
  ): React.JSX.Element;
  // Untagged targets infer their data from the payload. Tagged targets infer it
  // from their own kind, so a partial payload cannot weaken that kind's contract.
  <TSourceData = unknown, TLocalData = unknown>(
    props: DraggableTargetPropsWithRequiredAccept<TSourceData, TLocalData> & {
      kind?: undefined;
    } & RequiredDropTargetPayload<TSourceData, TLocalData>,
  ): React.JSX.Element;
  <TSourceData = unknown, TLocalData = unknown>(
    props: DraggableTargetPropsWithRequiredAccept<TSourceData, TLocalData> & {
      kind?: DragKind<TLocalData> | undefined;
    } & RequiredDropTargetPayload<TSourceData, NoInfer<TLocalData>>,
  ): React.JSX.Element;
  <TSourceData = unknown>(
    props: DraggableTargetPropsWithRequiredAccept<TSourceData, undefined> &
      DragParametersWithOptionalPayload<DropTargetPayloadParameters<TSourceData, undefined>>,
  ): React.JSX.Element;
  // Private inference overloads retain precise payload unions for heterogeneous
  // `accept` arrays. Explicit component generics use the payload-keyed overloads above.
  <TAccept extends AnyDragAccept = DragKind<unknown>, TLocalData = unknown>(
    props: DraggableTargetPropsFromAccept<TAccept, TLocalData> & {
      kind?: undefined;
    } & RequiredDropTargetPayload<AcceptedDragPayload<TAccept>, TLocalData>,
  ): React.JSX.Element;
  <TAccept extends AnyDragAccept = DragKind<unknown>, TLocalData = unknown>(
    props: DraggableTargetPropsFromAccept<TAccept, TLocalData> & {
      kind?: DragKind<TLocalData> | undefined;
    } & RequiredDropTargetPayload<AcceptedDragPayload<TAccept>, NoInfer<TLocalData>>,
  ): React.JSX.Element;
  <TAccept extends AnyDragAccept = DragKind<unknown>>(
    props: DraggableTargetPropsFromAccept<TAccept, undefined> &
      DragParametersWithOptionalPayload<
        DropTargetPayloadParameters<AcceptedDragPayload<TAccept>, undefined>
      >,
  ): React.JSX.Element;
};

export interface DraggableTargetState {
  /**
   * Whether a matching drag source is currently over this target or a nested
   * descendant. Always `false` when `trackDragOver` is `false`.
   */
  dragOver: boolean;
  /**
   * Whether this target accepts the current drag, regardless of pointer position.
   * Use it to highlight all compatible drop targets. It is `false` when no drag is
   * active, the target is disabled, or `trackDragOver` is `false`. The value is
   * based on `accept`; `canDrop` is evaluated only for the current position.
   */
  accepting: boolean;
  /**
   * Whether this is the innermost active target. A nested ancestor has `dragOver`
   * true but `dragOverInnermost` false while a descendant target is active. Always
   * `false` when `trackDragOver` is `false`.
   */
  dragOverInnermost: boolean;
  /**
   * Whether `canDrop` returned `'reject'` for the current position. Use it to
   * display feedback such as a full column. It is mutually exclusive with
   * `dragOver` and always `false` when `trackDragOver` is `false`.
   */
  rejected: boolean;
  /** Whether the drop target is disabled. */
  disabled: boolean;
}

// Every `Draggable.Target` prop except its payload fields; the overloads and `Props` below
// each add it back with their own optionality. See `DraggableConfig.payload`.
type DraggableTargetPropsBase<TSourceData, TLocalData> = BaseUIComponentProps<
  'div',
  DraggableTargetState
> &
  Omit<RegisterDropTargetParameters<TSourceData, TLocalData>, 'payload' | 'getPayload'> & {
    /**
     * Whether to update drag-over state and its data attributes. Set to `false`
     * when the target renders no drag-over feedback; drag callbacks still fire.
     * @default true
     */
    trackDragOver?: boolean | undefined;
  };

type DropTargetPayloadParameters<TSourceData, TLocalData> = Pick<
  RegisterDropTargetParameters<TSourceData, TLocalData>,
  'payload' | 'getPayload'
>;

type RequiredDropTargetPayload<TSourceData, TLocalData> = DragParametersWithRequiredPayload<
  DropTargetPayloadParameters<TSourceData, TLocalData>,
  DropTargetPayload<TLocalData>,
  DropTargetPayloadGetter<TSourceData, TLocalData>
>;

/**
 * Component props with a required `accept` declaration.
 */
type DraggableTargetPropsWithRequiredAccept<TSourceData, TLocalData> = DraggableTargetPropsBase<
  TSourceData,
  TLocalData
> &
  Required<Pick<RegisterDropTargetParameters<TSourceData, TLocalData>, 'accept'>>;

/** Component props with source data inferred from the concrete `accept` value. */
type DraggableTargetPropsFromAccept<
  TAccept extends AnyDragAccept,
  TLocalData,
> = DragParametersWithRequiredAccept<
  DraggableTargetPropsBase<AcceptedDragPayload<TAccept>, TLocalData>,
  TAccept
>;

/**
 * Requires `payload` when the caller declares local target data. Generic wrappers
 * use {@link DraggableTargetPropsWithPayload} instead.
 */
type DraggableTargetPayloadField<TSourceData, TLocalData> = [TLocalData] extends [undefined]
  ? DragParametersWithOptionalPayload<DropTargetPayloadParameters<TSourceData, TLocalData>>
  : RequiredDropTargetPayload<TSourceData, TLocalData>;

// Keyed on the payloads rather than on an `accept` value, so a wrapper's props stay
// readable as `Props<Card, Slot>`.
export type DraggableTargetProps<TSourceData = undefined, TLocalData = undefined> = Omit<
  DraggableTargetPropsBase<TSourceData, TLocalData>,
  'accept'
> &
  DraggableTargetPayloadField<TSourceData, TLocalData> &
  ([TSourceData, TLocalData] extends [undefined, undefined]
    ? { accept?: DragAccept<TSourceData> | undefined }
    : Required<Pick<RegisterDropTargetParameters<TSourceData, TLocalData>, 'accept'>>);

/**
 * Props for a generic `Draggable.Target` wrapper whose local payload is always
 * required. Use this alias when spreading props with unbound source and local
 * payload types into the root.
 */
export type DraggableTargetPropsWithPayload<TSourceData, TLocalData> =
  DraggableTargetPropsWithRequiredAccept<TSourceData, TLocalData> &
    RequiredDropTargetPayload<TSourceData, TLocalData>;

export namespace DraggableTarget {
  export type State = DraggableTargetState;
  export type Props<TSourceData = undefined, TLocalData = undefined> = DraggableTargetProps<
    TSourceData,
    TLocalData
  >;
  export type PropsWithPayload<TSourceData, TLocalData> = DraggableTargetPropsWithPayload<
    TSourceData,
    TLocalData
  >;
}

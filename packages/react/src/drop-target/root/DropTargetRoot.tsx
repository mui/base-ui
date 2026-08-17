'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { BaseUIComponentProps } from '../../internals/types';
import type {
  NativeDragEventProps,
  RegisterDropTargetParameters,
  WithOptionalPayload,
  WithRequiredPayload,
  WithRequiredAccept,
} from '../../types/dragRegistration';
import type {
  AcceptedDragPayload,
  AnyDragAccept,
  DragAccept,
  DragKind,
  DropTargetPayload,
  DropTargetPayloadGetter,
} from '../../types/drag';
import { useDropTargetElement } from './useDropTargetElement';
import type { UseDropTargetElementParameters } from './useDropTargetElement';

const stateAttributesMapping: StateAttributesMapping<DropTargetRootState> = {
  // The default mapping only lowercases the state key, which would yield
  // `data-dragoverinnermost`. The literal is inlined rather than read from
  // `DropTargetRootDataAttributes` so that enum stays tree-shakeable — it exists
  // for types and the generated reference only, and `enumSync.test.tsx` is what
  // keeps the two in step.
  dragOver: (value) => (value ? { 'data-drag-over': '' } : null),
  dragOverInnermost: (value) => (value ? { 'data-drag-over-innermost': '' } : null),
};

/**
 * Makes its element a drop target, so matching drag sources can be released on it.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drop Target](https://base-ui.com/react/components/drop-target)
 */
export const DropTargetRoot = React.forwardRef(function DropTargetRoot<
  TSourceData = unknown,
  TLocalData = unknown,
>(
  componentProps: DropTargetRootPropsBase<TSourceData, TLocalData> & {
    accept?: DragAccept<TSourceData> | undefined;
    payload?: DropTargetPayload<TSourceData, TLocalData> | undefined;
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
    label,
    kind,
    accept,
    canDrop,
    disabled,
    payload,
    getPayload,
    snap,
    trackDragOver,
    // Event handlers
    onDragStart,
    onDrag,
    onDropTargetChange,
    onDragEnter,
    onDragLeave,
    onDrop,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  // A fresh object per render is fine: `useDropTargetElement` reads it through a
  // ref and never compares it.
  const params = {
    label,
    kind,
    accept,
    canDrop,
    disabled,
    payload,
    getPayload,
    snap,
    trackDragOver,
    onDragStart,
    onDrag,
    onDropTargetChange,
    onDragEnter,
    onDragLeave,
    onDrop,
  } as UseDropTargetElementParameters;

  const { ref, dragOver, dragOverInnermost, rejected, accepting } = useDropTargetElement(params);

  const state: DropTargetRoot.State = {
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
  // and leave `self.payload` typed while the engine delivers `undefined`.
  // The fallback's local data is `undefined`, not `unknown`: `kind` is typed from it,
  // so a payload-carrying `kind={column}` with no `payload` is rejected here rather
  // than compiling with `column.matches(target)` narrowing to a payload that is
  // `undefined` at runtime.
}) as {
  <TSourceData = unknown, TLocalData = unknown>(
    props: DropTargetRootPropsWithRequiredAccept<TSourceData, TLocalData> &
      RequiredDropTargetPayload<TSourceData, TLocalData>,
  ): React.JSX.Element;
  <TSourceData = unknown>(
    props: DropTargetRootPropsWithRequiredAccept<TSourceData, undefined> &
      WithOptionalPayload<DropTargetPayloadParameters<TSourceData, undefined>>,
  ): React.JSX.Element;
  // Private inference overloads retain precise payload unions for heterogeneous
  // `accept` arrays. Explicit component generics use the payload-keyed overloads above.
  <TAccept extends AnyDragAccept = DragKind<unknown>, TLocalData = unknown>(
    props: DropTargetRootPropsFromAccept<TAccept, TLocalData> &
      RequiredDropTargetPayload<AcceptedDragPayload<TAccept>, TLocalData>,
  ): React.JSX.Element;
  <TAccept extends AnyDragAccept = DragKind<unknown>>(
    props: DropTargetRootPropsFromAccept<TAccept, undefined> &
      WithOptionalPayload<DropTargetPayloadParameters<AcceptedDragPayload<TAccept>, undefined>>,
  ): React.JSX.Element;
};

export interface DropTargetRootState {
  /**
   * Whether a matching drag source is currently over this target or a nested
   * descendant. Always `false` when `trackDragOver` is `false`.
   */
  dragOver: boolean;
  /**
   * Whether the drag in progress is one this target accepts, wherever the pointer
   * is — the state to key a "valid drop zone" highlight on. `false` when no drag
   * is running, when the target is `disabled`, and always when `trackDragOver` is
   * `false`. Matched on `accept` alone: `canDrop` answers per position, so it
   * cannot describe a target the pointer is nowhere near.
   */
  accepting: boolean;
  /**
   * Whether this is the innermost active target. A nested ancestor has `dragOver`
   * true but `dragOverInnermost` false while a descendant target is active. Always
   * `false` when `trackDragOver` is `false`.
   */
  dragOverInnermost: boolean;
  /**
   * Whether this target is currently refusing the drag: its `canDrop` returned
   * `'reject'` for the current position, the state to key a "column is full"
   * affordance on. Mutually exclusive with `dragOver`, and always `false` when
   * `trackDragOver` is `false`.
   */
  rejected: boolean;
  /** Whether the drop target is disabled. */
  disabled: boolean;
}

// Every `DropTarget.Root` prop except its payload fields; the overloads and `Props` below
// each add it back with their own optionality. See `DraggableConfig.payload`.
type DropTargetRootPropsBase<TSourceData, TLocalData> = Omit<
  BaseUIComponentProps<'div', DropTargetRootState>,
  // The whole native HTML5 drag event family is replaced by this engine.
  NativeDragEventProps
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

type RequiredDropTargetPayload<TSourceData, TLocalData> = WithRequiredPayload<
  DropTargetPayloadParameters<TSourceData, TLocalData>
>;

/**
 * Component props with a required `accept` declaration.
 */
type DropTargetRootPropsWithRequiredAccept<TSourceData, TLocalData> = DropTargetRootPropsBase<
  TSourceData,
  TLocalData
> &
  Required<Pick<RegisterDropTargetParameters<TSourceData, TLocalData>, 'accept'>>;

/** Component props with source data inferred from the concrete `accept` value. */
type DropTargetRootPropsFromAccept<TAccept extends AnyDragAccept, TLocalData> = WithRequiredAccept<
  DropTargetRootPropsBase<AcceptedDragPayload<TAccept>, TLocalData>,
  TAccept
>;

/**
 * Requires `payload` when the caller declares local target data. Generic wrappers
 * use {@link DropTargetRootPropsWithPayload} instead.
 */
type DropTargetRootPayloadField<TSourceData, TLocalData> = [TLocalData] extends [undefined]
  ? WithOptionalPayload<DropTargetPayloadParameters<TSourceData, TLocalData>>
  : RequiredDropTargetPayload<TSourceData, TLocalData>;

// Keyed on the payloads rather than on an `accept` value, so a wrapper's props stay
// readable as `Props<Card, Slot>`.
export type DropTargetRootProps<
  TSourceData = unknown,
  TLocalData = undefined,
> = DropTargetRootPropsBase<TSourceData, TLocalData> &
  DropTargetRootPayloadField<TSourceData, TLocalData> &
  // Required here too, so a wrapper spreading `Props` into the component still
  // satisfies it — the component's own overloads require `accept` (see
  // `WithRequiredAccept`), and a wrapper that made it optional would push the
  // error onto its callers' spread instead of onto its own declaration.
  Required<Pick<RegisterDropTargetParameters<TSourceData, TLocalData>, 'accept'>>;

/**
 * Props for a generic `DropTarget.Root` wrapper whose local payload is always
 * required. Use this alias when spreading props with unbound source and local
 * payload types into the root.
 */
export type DropTargetRootPropsWithPayload<TSourceData, TLocalData> =
  DropTargetRootPropsWithRequiredAccept<TSourceData, TLocalData> &
    RequiredDropTargetPayload<TSourceData, TLocalData>;

export namespace DropTargetRoot {
  export type State = DropTargetRootState;
  export type Props<TSourceData = unknown, TLocalData = undefined> = DropTargetRootProps<
    TSourceData,
    TLocalData
  >;
  export type PropsWithPayload<TSourceData, TLocalData> = DropTargetRootPropsWithPayload<
    TSourceData,
    TLocalData
  >;
}

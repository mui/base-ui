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
  TSourcePayload = unknown,
  TTargetPayload = unknown,
>(
  componentProps: Omit<DraggableTargetPropsBase<TSourcePayload, TTargetPayload>, 'accept'> & {
    /**
     * One or more drag source kinds accepted by this target. Defaults to the
     * nearest provider's no-payload kind. Pass `Draggable.anyKind` to accept every
     * drag. In that case, `source.payload` is `unknown`.
     *
     * The target ignores a source whose kind is not accepted. An ancestor target can
     * still accept it. Base UI checks `accept` before `canDrop`.
     */
    accept?: DragAccept<TSourcePayload> | undefined;
    payload?: DropTargetPayload<TTargetPayload> | undefined;
    getPayload?: DropTargetPayloadGetter<TSourcePayload, TTargetPayload> | undefined;
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
  // Overloaded like `Draggable.Root` so a declared `TTargetPayload` can't omit `payload`
  // and leave `target.payload` typed while the engine delivers `undefined`.
  // The fallback's target payload is `undefined`, not `unknown`: `kind` is typed from it,
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
  <TSourcePayload = unknown, TTargetPayload = unknown>(
    props: DraggableTargetPropsWithRequiredAccept<TSourcePayload, TTargetPayload> & {
      kind?: undefined;
    } & RequiredDropTargetPayload<TSourcePayload, TTargetPayload>,
  ): React.JSX.Element;
  <TSourcePayload = unknown, TTargetPayload = unknown>(
    props: DraggableTargetPropsWithRequiredAccept<TSourcePayload, TTargetPayload> & {
      kind?: DragKind<TTargetPayload> | undefined;
    } & RequiredDropTargetPayload<TSourcePayload, NoInfer<TTargetPayload>>,
  ): React.JSX.Element;
  <TSourcePayload = unknown>(
    props: DraggableTargetPropsWithRequiredAccept<TSourcePayload, undefined> &
      DragParametersWithOptionalPayload<DropTargetPayloadParameters<TSourcePayload, undefined>>,
  ): React.JSX.Element;
  // Private inference overloads retain precise payload unions for heterogeneous
  // `accept` arrays. Explicit component generics use the payload-keyed overloads above.
  <TAccept extends AnyDragAccept = DragKind<unknown>, TTargetPayload = unknown>(
    props: DraggableTargetPropsFromAccept<TAccept, TTargetPayload> & {
      kind?: undefined;
    } & RequiredDropTargetPayload<AcceptedDragPayload<TAccept>, TTargetPayload>,
  ): React.JSX.Element;
  <TAccept extends AnyDragAccept = DragKind<unknown>, TTargetPayload = unknown>(
    props: DraggableTargetPropsFromAccept<TAccept, TTargetPayload> & {
      kind?: DragKind<TTargetPayload> | undefined;
    } & RequiredDropTargetPayload<AcceptedDragPayload<TAccept>, NoInfer<TTargetPayload>>,
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
type DraggableTargetPropsBase<TSourcePayload, TTargetPayload> = BaseUIComponentProps<
  'div',
  DraggableTargetState
> &
  Omit<RegisterDropTargetParameters<TSourcePayload, TTargetPayload>, 'payload' | 'getPayload'> & {
    /**
     * Whether to update drag-over state and its data attributes. Set to `false`
     * when the target renders no drag-over feedback; drag callbacks still fire.
     * @default true
     */
    trackDragOver?: boolean | undefined;
  };

type DropTargetPayloadParameters<TSourcePayload, TTargetPayload> = Pick<
  RegisterDropTargetParameters<TSourcePayload, TTargetPayload>,
  'payload' | 'getPayload'
>;

type RequiredDropTargetPayload<TSourcePayload, TTargetPayload> = DragParametersWithRequiredPayload<
  DropTargetPayloadParameters<TSourcePayload, TTargetPayload>,
  DropTargetPayload<TTargetPayload>,
  DropTargetPayloadGetter<TSourcePayload, TTargetPayload>
>;

/**
 * Component props with a required `accept` declaration.
 */
type DraggableTargetPropsWithRequiredAccept<TSourcePayload, TTargetPayload> =
  DraggableTargetPropsBase<TSourcePayload, TTargetPayload> &
    Required<Pick<RegisterDropTargetParameters<TSourcePayload, TTargetPayload>, 'accept'>>;

/** Component props with source payload inferred from the concrete `accept` value. */
type DraggableTargetPropsFromAccept<
  TAccept extends AnyDragAccept,
  TTargetPayload,
> = DragParametersWithRequiredAccept<
  DraggableTargetPropsBase<AcceptedDragPayload<TAccept>, TTargetPayload>,
  TAccept
>;

/**
 * Requires `payload` when the caller declares target payload. Generic wrappers
 * use {@link DraggableTargetPropsWithPayload} instead.
 */
type DraggableTargetPayloadField<TSourcePayload, TTargetPayload> = [TTargetPayload] extends [
  undefined,
]
  ? DragParametersWithOptionalPayload<DropTargetPayloadParameters<TSourcePayload, TTargetPayload>>
  : RequiredDropTargetPayload<TSourcePayload, TTargetPayload>;

// Keyed on the payloads rather than on an `accept` value, so a wrapper's props stay
// readable as `Props<Card, Slot>`.
export type DraggableTargetProps<TSourcePayload = undefined, TTargetPayload = undefined> = Omit<
  DraggableTargetPropsBase<TSourcePayload, TTargetPayload>,
  'accept'
> &
  DraggableTargetPayloadField<TSourcePayload, TTargetPayload> &
  ([TSourcePayload, TTargetPayload] extends [undefined, undefined]
    ? {
        /**
         * One or more drag source kinds accepted by this target. Defaults to the
         * nearest provider's no-payload kind. Pass `Draggable.anyKind` to accept every
         * drag. In that case, `source.payload` is `unknown`.
         *
         * The target ignores a source whose kind is not accepted. An ancestor target can
         * still accept it. Base UI checks `accept` before `canDrop`.
         */
        accept?: DragAccept<TSourcePayload> | undefined;
      }
    : Required<Pick<RegisterDropTargetParameters<TSourcePayload, TTargetPayload>, 'accept'>>);

/**
 * Props for a generic `Draggable.Target` wrapper whose local payload is always
 * required. Use this alias when spreading props with unbound source and local
 * payload types into the root.
 */
export type DraggableTargetPropsWithPayload<TSourcePayload, TTargetPayload> =
  DraggableTargetPropsWithRequiredAccept<TSourcePayload, TTargetPayload> &
    RequiredDropTargetPayload<TSourcePayload, TTargetPayload>;

export namespace DraggableTarget {
  export type State = DraggableTargetState;
  export type Props<TSourcePayload = undefined, TTargetPayload = undefined> = DraggableTargetProps<
    TSourcePayload,
    TTargetPayload
  >;
  export type PropsWithPayload<TSourcePayload, TTargetPayload> = DraggableTargetPropsWithPayload<
    TSourcePayload,
    TTargetPayload
  >;
}

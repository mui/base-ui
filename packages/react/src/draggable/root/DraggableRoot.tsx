'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { BaseUIComponentProps } from '../../internals/types';
import type {
  NativeDragEventProps,
  RegisterDraggableParameters,
  WithOptionalPayload,
  WithRequiredPayload,
} from '../../types/dragRegistration';
import type { DraggablePayload, DraggablePayloadGetter } from '../../types/drag';
import { useDraggableElement } from './useDraggableElement';
import { DraggableRootContext } from './DraggableRootContext';
import { useDragPreviewContext } from '../../utils/drag-and-drop/overlay/DragPreviewContext';

const stateAttributesMapping: StateAttributesMapping<DraggableRootState> = {
  // The engine owns `data-dragging`: it lands only once the preview has been built
  // and measured, so the clone never inherits it. React writing it too would race
  // that ordering.
  dragging: () => null,
};

// Without a role, the default focusable `<div>` is exposed as an unnamed `generic`
// node, which makes assistive technology drop the engine's `aria-roledescription`
// and leaves the pickup gesture undiscoverable. A polymorphic render target keeps
// its native semantics instead. Passed before `elementProps`, so an explicit role
// still wins.
const KEYBOARD_FOCUSABLE_PROPS = { tabIndex: 0 } as const;
const DEFAULT_KEYBOARD_ROLE_PROPS = { role: 'button' } as const;

/**
 * Makes its element a drag source, so it can be picked up with the pointer or the
 * keyboard and dropped on matching drop targets.
 * Renders a `<div>` element.
 *
 * While dragging, a clone of the element follows the pointer.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/components/draggable)
 */
export const DraggableRoot = React.forwardRef(function DraggableRoot<TData = undefined>(
  componentProps: DraggableRootPropsBase<TData> & {
    payload?: DraggablePayload<TData> | undefined;
    getPayload?: DraggablePayloadGetter<TData> | undefined;
  },
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    // Rendering props
    className,
    render,
    style,
    children,
    // Drag source props. Listed explicitly because whatever stays in
    // `elementProps` is spread onto the `<div>`, where an engine parameter would
    // land as an attribute.
    label,
    kind,
    payload,
    getPayload,
    previewKey,
    disabled,
    pointerActivation,
    dragCursor,
    // Accessibility props
    ariaRoleDescription,
    keyboardInstructions,
    keyboardAnnouncements,
    keyboardActivation,
    keyboardMovement,
    modifiers,
    finalFocus,
    trackDisplacement,
    // Event handlers
    onBeforeDragStart,
    onDragStart,
    onDrag,
    onDropTargetChange,
    onDrop,
    onDragEnd,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  // A fresh object per render is fine: `useDraggableElement` reads it through a
  // ref and never compares it.
  const params = {
    label,
    kind,
    payload,
    getPayload,
    previewKey,
    disabled,
    pointerActivation,
    dragCursor,
    ariaRoleDescription,
    keyboardInstructions,
    keyboardAnnouncements,
    keyboardActivation,
    keyboardMovement,
    modifiers,
    finalFocus,
    onBeforeDragStart,
    onDragStart,
    onDrag,
    onDropTargetChange,
    onDrop,
    onDragEnd,
  } as RegisterDraggableParameters<TData>;

  // `trackDisplacement` stays out of `params` on purpose: it is component-level
  // behavior, not a registration parameter, and the engine never reads it.
  const { ref, dragging, setHandleElement, previewHandle, hasHandle } = useDraggableElement<TData>(
    params,
    { trackDisplacement },
  );

  const state: DraggableRoot.State = { dragging, disabled: disabled ?? false };

  // The provider seen from here is the one the engine publishes preview content
  // through; `Draggable.Preview` compares its own nearest provider against it.
  const previewContext = useDragPreviewContext();

  const contextValue = React.useMemo(
    () => ({
      setHandleElement,
      previewHandle,
      previewContext,
      label,
      disabled: disabled ?? false,
    }),
    [setHandleElement, previewHandle, previewContext, label, disabled],
  );

  // Focusable whenever the element is keyboard-draggable at all: with `'auto'` screen
  // readers are told "press Space or Enter to pick up", and with `'manual'` the
  // consumer's own pickup route starts from focus too. Either way the element must be
  // reachable with Tab. With a handle attached, pickup and the a11y attributes live on
  // the handle instead, so the root stays out of the tab order.
  // `hasHandle` is `null` until the mount commit resolves it, and an unconfirmed
  // root stays unfocusable: the server can't see handles, so SSR HTML and the
  // hydration render would otherwise put a second tab stop next to every handle.
  // A user-supplied `tabIndex` in the spread props overrides this.
  const keyboardFocusable = !disabled && keyboardActivation !== 'off' && hasHandle === false;

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, ref],
    props: [
      { children },
      keyboardFocusable ? KEYBOARD_FOCUSABLE_PROPS : undefined,
      keyboardFocusable && render === undefined ? DEFAULT_KEYBOARD_ROLE_PROPS : undefined,
      elementProps,
    ],
    stateAttributesMapping,
  });

  return (
    <DraggableRootContext.Provider value={contextValue}>{element}</DraggableRootContext.Provider>
  );
  // Overloaded so `payload` stays required for a kind that declares one: a
  // `kind={card}` with no payload can't leave the engine emitting `undefined` where a
  // `Card` was promised. Expressing that as a conditional on the props type instead
  // would make it a deferred conditional a generic wrapper can't spread into.
}) as {
  <TData>(
    props: DraggableRootPropsBase<TData> & RequiredDraggablePayload<TData>,
  ): React.JSX.Element;
  (
    props: DraggableRootPropsBase<undefined> &
      WithOptionalPayload<DraggablePayloadParameters<undefined>>,
  ): React.JSX.Element;
};

export interface DraggableRootState {
  /**
   * Whether this element is the one currently being dragged.
   */
  dragging: boolean;
  /**
   * Whether the draggable is disabled.
   */
  disabled: boolean;
}

// Every `Draggable.Root` prop except its payload fields; the overloads and `Props` below
// each add it back with their own optionality. See `DraggableConfig.payload`.
type DraggableRootPropsBase<TData> = Omit<
  BaseUIComponentProps<'div', DraggableRootState>,
  // - `children` is widened below.
  // - the whole native HTML5 drag event family is replaced by this engine
  'children' | 'draggable' | NativeDragEventProps
> &
  // The preview is described by a `Draggable.Preview` or a `Draggable.ClonedPreview`
  // rendered inside this component, and the drag handle by a `Draggable.Handle`,
  // never from here.
  Omit<
    RegisterDraggableParameters<TData>,
    'dragPreview' | 'dragHandle' | 'payload' | 'getPayload'
  > & {
    children?: React.ReactNode | undefined;
    /**
     * Whether to expose this element's layout displacement through
     * `data-displacing`, `data-starting-style`, and the displacement CSS variables.
     * @default false
     */
    trackDisplacement?: boolean | undefined;
  };

export type DraggableRootProps<TData = undefined> = DraggableRootPropsBase<TData> &
  DraggableRootPayloadField<TData>;

/**
 * Props for a generic `Draggable.Root` wrapper whose payload is always required.
 * Use this alias when spreading props with an unbound payload type into the root.
 */
export type DraggableRootPropsWithPayload<TData> = DraggableRootPropsBase<TData> &
  RequiredDraggablePayload<TData>;

type DraggablePayloadParameters<TData> = Pick<
  RegisterDraggableParameters<TData>,
  'payload' | 'getPayload'
>;

type RequiredDraggablePayload<TData> = WithRequiredPayload<
  DraggablePayloadParameters<TData>,
  DraggablePayload<TData>,
  DraggablePayloadGetter<TData>
>;

/**
 * Requires `payload` when the caller declares a payload type. Generic wrappers
 * use {@link DraggableRootPropsWithPayload} instead.
 */
type DraggableRootPayloadField<TData> = [TData] extends [undefined]
  ? WithOptionalPayload<DraggablePayloadParameters<TData>>
  : RequiredDraggablePayload<TData>;

export namespace DraggableRoot {
  export type State = DraggableRootState;
  export type Props<TData = undefined> = DraggableRootProps<TData>;
  export type PropsWithPayload<TData> = DraggableRootPropsWithPayload<TData>;
}

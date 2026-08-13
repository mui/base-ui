'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { warn } from '@base-ui/utils/warn';
import { useTranslations } from '../../internals/localization-context/LocalizationContext';
import {
  resolveKeyboardInstructions,
  useRegisterDraggable,
} from '../../utils/drag-and-drop/useInnerDragEngine';
import { buildStaticSetupKey } from '../../utils/drag-and-drop/draggable';
import {
  createDragPreviewHandle,
  type DragPreviewHandle,
} from '../../utils/drag-and-drop/dragPreviewDeclaration';
import type {
  InternalDraggableParameters,
  RegisterDraggableParameters,
} from '../../types/dragRegistration';
import type { DragCleanupFn } from '../../types/drag';
import {
  dragSessionStore,
  selectors,
  updateDragSourceElement,
} from '../../utils/drag-and-drop/dragSessionStore';
import type { DragSessionState } from '../../utils/drag-and-drop/dragSessionStore';
import { useRegistrationRef } from '../../utils/drag-and-drop/useRegistrationRef';
import { retargetActivePreviewSource } from '../../utils/drag-and-drop/activePreview';
import {
  scheduleDisplacementSweep,
  trackDisplacedElement,
} from '../../utils/drag-and-drop/displacement';

// Read the element from `ref` at selection time so `dragging` keeps tracking
// the node behind the ref even when a virtualizer swaps it. Module-scope
// (stable-identity) selector so `useStore`'s selector-identity fast path holds.
type ElementRef = { readonly current: Element | null };
function selectIsDragging(state: DragSessionState | null, r: ElementRef): boolean {
  return selectors.isDraggingElement(state, r.current);
}

/**
 * Registers the element the returned `ref` is attached to as a drag source.
 * Backs `Draggable.Root`, which is the public API.
 * @internal
 */
export function useDraggableElement<TData = undefined>(
  parameters: RegisterDraggableParameters<TData>,
  options?: UseDraggableElementOptions,
): UseDraggableElementReturnValue<TData> {
  const registerDraggable = useRegisterDraggable();
  const paramsRef = useValueAsRef(parameters);
  const trackDisplacement = options?.trackDisplacement ?? false;

  // The `dragging` selector reads the live element behind this ref.
  const elementRef = React.useRef<HTMLElement | null>(null);
  // Every mounted handle, in mount order, tagged with the token its
  // `Draggable.Handle` identifies itself by. Only the first drives pickup; the
  // rest are tracked so unmounting one falls back to a survivor instead of to
  // "no handle", which would silently make the whole element draggable.
  const attachedHandlesRef = React.useRef<Array<{ token: object; node: HTMLElement }>>([]);

  // The link a `Draggable.Preview` declares into. Created once, so carrying it on
  // context never re-registers anything.
  const previewHandle = useRefWithInit(createDragPreviewHandle<TData>).current;

  // Whether a `Draggable.Handle` is attached, `null` while unknown, which drives
  // `Draggable.Root`'s default `tabIndex`. Handles only announce themselves through
  // their client-side ref callback, so the server (and the hydration render) cannot
  // know — starting at `false` there would emit a second tab stop on the root next
  // to every SSR'd handle. The unknown resolves in the mount effect below.
  const [hasHandle, setHasHandle] = React.useState<boolean | null>(null);

  const registrationRef = useRegistrationRef<HTMLElement>((element) => {
    // These accessors only read stable refs, so keep one function per
    // registration instead of rebuilding both on every engine dispatch.
    const getAttachedHandle = () => attachedHandlesRef.current[0]?.node ?? null;
    const getDragPreviewDeclaration = () => previewHandle.getDeclaration();
    let lastParams: RegisterDraggableParameters<TData> | null = null;
    let normalized: InternalDraggableParameters<TData> | null = null;

    return registerDraggable<TData>(
      element,
      () => {
        // `.next` is the current render's params (see `useRegistrationRef`).
        const params = paramsRef.next;
        if (params === lastParams && normalized !== null) {
          return normalized;
        }
        // An imperative `dragHandle` wins; otherwise fall back to the element
        // behind `Draggable.Handle` (`null` there means the whole element is the handle).
        lastParams = params;
        normalized = {
          ...params,
          dragHandle: params.dragHandle ?? getAttachedHandle,
          getDragPreviewDeclaration,
        };
        return normalized;
      },
      // React replaces `params` each render, so identity is a sound revision key.
      // Imperative registrations intentionally leave this off: their getter may
      // mutate and return one stable object while behavior changes per event.
      true,
    );
  });

  // The last non-null node this ref held. React detaches the old node before
  // attaching its replacement, so `elementRef.current` is already `null` by the time
  // the new node arrives — comparing against it would never observe a direct
  // `a -> b` swap.
  const lastNodeRef = React.useRef<HTMLElement | null>(null);

  // The live displacement-tracking teardown; owned by the tracking effect below,
  // re-pointed here on a node swap.
  const displacementCleanupRef = React.useRef<DragCleanupFn | null>(null);

  // Forward the attached node to both the engine registration and the local ref.
  // Stable, so this merged callback is created once.
  const ref = useRefWithInit(() => (node: HTMLElement | null) => {
    elementRef.current = node;
    if (node) {
      // A virtualizer can remount the item to a fresh node mid-drag. When this
      // draggable was the active source, re-point the session at the new element
      // so `dragging` keeps tracking it (it went stale, then false, otherwise).
      // `updateDragSourceElement` already guards against cross-drag misfires.
      const previous = lastNodeRef.current;
      if (previous && previous !== node) {
        if (updateDragSourceElement(previous, node)) {
          // The session now points at the new node; move `data-dragging` with it, or
          // a CSS-only dim would stop applying the moment the row is recycled.
          retargetActivePreviewSource(node);
        }
        // The displacement tracker is keyed by node and its effect does not
        // re-run on a swap: follow the swap here, or the new node never
        // animates while the old one lingers in the registry.
        if (displacementCleanupRef.current) {
          displacementCleanupRef.current();
          displacementCleanupRef.current = trackDisplacedElement(node);
        }
      }
      lastNodeRef.current = node;
    }
    registrationRef(node);
  }).current;

  // A re-registration that was skipped mid-drag (handle swap or reconcile-input
  // change while this element was the active source); flushed once `dragging`
  // flips back to false so the swapped-in handle still receives the static setup.
  const pendingReconcileRef = React.useRef(false);

  // Re-run the draggable registration when the handle node attaches or detaches so
  // the static setup follows it.
  const setHandleElement = useRefWithInit(() => (node: HTMLElement | null, token: object) => {
    const handles = attachedHandlesRef.current;
    const index = handles.findIndex((handle) => handle.token === token);
    if (node) {
      if (index === -1) {
        handles.push({ token, node });
      } else {
        // Same handle, new node (a virtualizer recycling the row).
        handles[index].node = node;
      }
      if (process.env.NODE_ENV !== 'production') {
        if (handles.length > 1) {
          warn(
            'Base UI: a Draggable.Root contains more than one mounted Draggable.Handle. ' +
              'Pickup is restricted to the first one, so the others are inert and look broken. ' +
              'Render a single handle, switching its content or position instead of mounting a second.',
          );
        }
      }
    } else if (index !== -1) {
      handles.splice(index, 1);
    }
    setHasHandle(handles.length > 0);
    // Re-registration tears the static setup down and rebuilds it, which mid-gesture
    // would restore `user-select`/`touch-action` and drop the iOS touchmove guard.
    // The live `dragHandle` closure already reads `attachedHandlesRef` fresh, so skip
    // the teardown mid-drag and flush the re-registration when the drag ends.
    if (selectors.isDraggingElement(dragSessionStore.state, elementRef.current)) {
      pendingReconcileRef.current = true;
      return;
    }
    registrationRef(elementRef.current);
  }).current;

  // Resolve the unknown initial `hasHandle`: a handle's ref callback runs during
  // the mount commit, before this layout effect, so `attachedHandlesRef` is
  // already accurate here and the resolving re-render lands before first paint.
  useIsoLayoutEffect(() => {
    setHasHandle((previous) => previous ?? attachedHandlesRef.current.length > 0);
  }, []);

  // The static a11y setup is captured once at registration. Reconcile it when the
  // inputs that feed it change without a node swap: `keyboardActivation` and
  // `disabled`, the explicit aria and instruction overrides, and the active locale's
  // defaults. Skipped while this element is the active drag source so the reconcile
  // never tears down the live gesture setup mid-drag.
  const translations = useTranslations();
  const reconcileKey = buildStaticSetupKey({
    disabled: parameters.disabled,
    keyboardActivation: parameters.keyboardActivation,
    ariaRoleDescription: parameters.ariaRoleDescription ?? translations.dragRoleDescription,
    keyboardInstructions: resolveKeyboardInstructions(parameters, translations),
  });
  const isFirstReconcile = React.useRef(true);
  useIsoLayoutEffect(() => {
    if (isFirstReconcile.current) {
      // The registration ref callback already applied the setup with these
      // inputs on mount; only re-apply on a *subsequent* change.
      isFirstReconcile.current = false;
      return;
    }
    const element = elementRef.current;
    if (!element) {
      return;
    }
    if (selectors.isDraggingElement(dragSessionStore.state, element)) {
      pendingReconcileRef.current = true;
      return;
    }
    registrationRef(element);
    // `registrationRef` and `elementRef` are stable; only `reconcileKey` should retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconcileKey]);

  // Displacement is component-level behavior, not a registration parameter: it
  // reads the element and the session store, and the engine never sees it.
  // A virtualizer swapping the node mid-life goes through the ref callback, not
  // this effect: the callback re-points the tracking at the new node and the
  // cleanup stored in the ref stays the live one.
  useIsoLayoutEffect(() => {
    const element = elementRef.current;
    if (!trackDisplacement || !element) {
      return undefined;
    }
    displacementCleanupRef.current = trackDisplacedElement(element);
    return () => {
      displacementCleanupRef.current?.();
      displacementCleanupRef.current = null;
    };
  }, [trackDisplacement]);
  // Dependency-less on purpose: any tracked sibling that re-renders requests
  // the per-commit sweep, and the first request measures the whole registry, so
  // a memoized row that moved without re-rendering is still seen. The call is a
  // latched no-op outside a drag's displacement window; the element identifies
  // the requester, which is how the module detects a same-task second commit.
  useIsoLayoutEffect(() => {
    if (trackDisplacement) {
      scheduleDisplacementSweep(elementRef.current ?? undefined);
    }
  });

  const dragging = useStore(dragSessionStore, selectIsDragging, elementRef);

  // Flush a reconcile skipped mid-drag: `dragging` flipping false re-renders this
  // hook, so the swapped handle (or changed a11y inputs) receives the static
  // setup as soon as the drag ends.
  useIsoLayoutEffect(() => {
    if (!dragging && pendingReconcileRef.current) {
      pendingReconcileRef.current = false;
      registrationRef(elementRef.current);
    }
    // `registrationRef` and `elementRef` are stable; only `dragging` should retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  return { ref, dragging, setHandleElement, previewHandle, hasHandle };
}

export interface UseDraggableElementOptions {
  /** See `DraggableRoot`'s `trackDisplacement`. */
  trackDisplacement?: boolean | undefined;
}

export interface UseDraggableElementReturnValue<TData = undefined> {
  /** Ref callback to attach to the drag source element. Stable. */
  ref: React.RefCallback<HTMLElement>;
  /** Whether this element is the one currently being dragged. */
  dragging: boolean;
  /**
   * Whether a `Draggable.Handle` is currently attached — `null` until the mount
   * commit resolves it (handles attach through client-side ref callbacks, so
   * the server render cannot know).
   */
  hasHandle: boolean | null;
  /**
   * Attach or detach the child that should be the drag handle — pickup is then
   * restricted to it. Never called means the whole source is draggable. `token`
   * identifies the calling handle across attach and detach. Stable.
   */
  setHandleElement: (node: HTMLElement | null, token: object) => void;
  /** The link a `Draggable.Preview` declares into. Stable. */
  previewHandle: DragPreviewHandle<TData>;
}

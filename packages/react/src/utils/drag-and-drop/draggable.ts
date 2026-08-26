import type {
  DragCleanupFn,
  DragHandle,
  DragKind,
  DragStartContext,
  DraggablePayload,
  DraggablePayloadGetter,
  DragPreviewParameters,
  DragPreviewContainer,
  BeforeDragStartEventDetails,
  DragEventDetailsMap,
  DragEventMap,
  DragPreviewRenderEvent,
  DragModifiers,
} from '../../types/drag';
import type { DragPreviewDeclaration } from './dragPreviewDeclaration';
import type { DragActivationConfig } from './activation';
import { bindPointerListeners, unbindPointerListeners } from './synthetic/syntheticSensor';
import { getRegistration } from './draggableRegistry';
import { getSharedSlot } from './sharedState';
import { registerStaticSetupRefresh } from './staticSetupRefresh';
import { getDragEventRoot, onceCleanup, resolveElementReference } from './utils';

interface GestureSetupEntry {
  count: number;
  restore: () => void;
}

const gestureSetups = getSharedSlot<WeakMap<Element, GestureSetupEntry>>(
  'draggable.gestureSetups',
  () => new WeakMap<Element, GestureSetupEntry>(),
);

interface DraggableStaticSetupParameters {
  element: HTMLElement;
  dragHandle?: DragHandle | undefined;
  disabled?: boolean | undefined;
}

/**
 * Apply pointer gesture styles to one element. The setup is ref-counted because
 * multiple registrations can share a node.
 */
function applyGestureSetup(
  gestureElement: HTMLElement,
  disabled: boolean | undefined,
): DragCleanupFn {
  if (disabled) {
    return () => {};
  }

  let entry = gestureSetups.get(gestureElement);
  if (!entry) {
    const gestureStyle = gestureElement.style as CSSStyleDeclaration & Record<string, string>;
    const previous = {
      touchAction: gestureStyle.touchAction ?? '',
      userSelect: gestureStyle.userSelect ?? '',
      webkitUserSelect: gestureStyle.webkitUserSelect ?? '',
      webkitTouchCallout: gestureStyle.webkitTouchCallout ?? '',
    };
    gestureStyle.touchAction = 'manipulation';
    gestureStyle.userSelect = 'none';
    gestureStyle.webkitUserSelect = 'none';
    gestureStyle.webkitTouchCallout = 'none';
    entry = {
      count: 0,
      restore() {
        if (gestureStyle.touchAction === 'manipulation') {
          gestureStyle.touchAction = previous.touchAction;
        }
        if (gestureStyle.userSelect === 'none') {
          gestureStyle.userSelect = previous.userSelect;
        }
        if (gestureStyle.webkitUserSelect === 'none') {
          gestureStyle.webkitUserSelect = previous.webkitUserSelect;
        }
        if (gestureStyle.webkitTouchCallout === 'none') {
          gestureStyle.webkitTouchCallout = previous.webkitTouchCallout;
        }
      },
    };
    gestureSetups.set(gestureElement, entry);
  }
  entry.count += 1;
  const activeEntry = entry;
  return onceCleanup(() => {
    const current = gestureSetups.get(gestureElement);
    if (current !== activeEntry) {
      return;
    }
    current.count -= 1;
    if (current.count === 0) {
      gestureSetups.delete(gestureElement);
      current.restore();
    }
  });
}

/**
 * Apply pointer gesture styles and refresh them from the live registration on
 * the next pointer interaction. This keeps imperative registrations correct when
 * `disabled` or the resolved handle changes without re-registration.
 */
export function applyDraggableStaticSetup(
  parameters: DraggableStaticSetupParameters,
): DragCleanupFn {
  const { element } = parameters;
  let appliedDisabled = Boolean(parameters.disabled);
  let appliedElement =
    (resolveElementReference(parameters.dragHandle, undefined) as HTMLElement | null) ?? element;
  let releaseSetup = applyGestureSetup(appliedElement, parameters.disabled);

  const refreshFromRegistration = () => {
    const getParameters = getRegistration(element);
    if (getParameters === undefined) {
      return;
    }
    const latest = getParameters();
    const nextDisabled = Boolean(latest.disabled);
    const nextElement =
      (resolveElementReference(latest.dragHandle, undefined) as HTMLElement | null) ?? element;
    if (nextDisabled === appliedDisabled && nextElement === appliedElement) {
      return;
    }
    releaseSetup();
    appliedDisabled = nextDisabled;
    appliedElement = nextElement;
    releaseSetup = applyGestureSetup(nextElement, latest.disabled);
  };

  const releaseRefresh = registerStaticSetupRefresh(element, refreshFromRegistration);

  return onceCleanup(() => {
    releaseRefresh();
    releaseSetup();
  });
}

/** Bind the pointer sensor at the element's document or shadow root. */
export function bindDraggableSensors(element: Element): DragCleanupFn {
  const root = getDragEventRoot(element);
  bindPointerListeners(root);
  return onceCleanup(() => {
    unbindPointerListeners(root);
  });
}

export type DraggableConfig<TData = undefined> = {
  element: HTMLElement;
  /** CSP nonce for the drag cursor stylesheet, wired by the React layer. @internal */
  styleNonce?: string | undefined;
  /** Whether the React layer has disabled runtime style elements. @internal */
  disableStyleElements?: boolean | undefined;
  /**
   * The data to attach to this drag, surfaced as `source.payload` on every
   * drag-and-drop event. Functions are preserved as ordinary payload values.
   */
  // Optional here so the conditional requirement lives in one place: `Draggable.Root`
  // and `registerDraggable` re-impose it through an overload, which also keeps a
  // wrapper spreading their `Props` from hitting a deferred conditional.
  payload?: DraggablePayload<TData> | undefined;
  /**
   * Resolves the data attached to this drag at drag start. Use this instead of
   * `payload` when the value depends on the pickup gesture.
   */
  getPayload?: DraggablePayloadGetter<TData> | undefined;
  /**
   * Stable identity used to reconnect a settling cloned preview to this source
   * after it remounts. Use the same key for the same logical item across the move.
   * Static payload identity is used as a fallback when it is referentially stable.
   */
  previewKey?: string | number | undefined;
  /**
   * The drag kind created with `Draggable.createKind`. Drop targets and monitors
   * list accepted kinds in `accept`. The kind determines the type of `payload` and
   * `source.payload`.
   */
  kind: DragKind<TData>;
  /**
   * Restricts drag initiation to a specific child element, ref, or resolver.
   * The handle should be available when the draggable is registered so it receives
   * the gesture styles.
   *
   * For sources registered imperatively. A draggable component restricts pickup
   * by rendering a `Draggable.Handle` instead.
   */
  dragHandle?: DragHandle | undefined;
  /**
   * Whether to disable dragging. Pointer presses keep their native behavior.
   * Use `onBeforeDragStart` instead when the decision depends on the gesture.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Event handler called when a drag is about to start, once the activation condition
   * is met and before the preview is built and `getPayload` runs.
   * Call `eventDetails.cancel()` to prevent the drag from starting.
   */
  onBeforeDragStart?:
    ((context: DragStartContext, eventDetails: BeforeDragStartEventDetails) => void) | undefined;
  /**
   * Determines when a pointer press starts a drag. Mouse and pen use a 5px distance
   * by default. Touch uses a 250ms press and hold. Pass one `DragActivation` for
   * every pointer type or a map with per-type values.
   */
  pointerActivation?: DragActivationConfig | undefined;
  /**
   * Constrains pointer movement with one modifier or an array applied
   * in order. See {@link DragModifiers} and the exported modifier presets.
   */
  modifiers?: DragModifiers | undefined;
  /**
   * CSS cursor applied across the document during a pointer drag. The drag preview
   * has `pointer-events: none`, so otherwise the cursor would depend on the element
   * under the pointer. Touch drags ignore this value.
   * Pass `false` to manage the cursor yourself.
   * @default 'grabbing'
   */
  dragCursor?: string | false | undefined;
  /**
   * The content and DOM container of the drag preview.
   * Omit it to use a sanitized clone of the source. The clone preserves classes
   * and live element state, but rewrites IDs to keep the document unique.
   *
   * For sources registered imperatively. A draggable that renders a preview part
   * describes its preview there instead.
   */
  dragPreview?: DragPreviewParameters<NoInfer<TData>> | undefined;
  /**
   * The preview part declared for this draggable, if any. Wired by the React layer;
   * the engine reads it once at drag start, before React can run, to decide between
   * cloning the source and building a host for custom content.
   * @internal
   */
  getDragPreviewDeclaration?: (() => DragPreviewDeclaration<NoInfer<TData>> | null) | undefined;
  /**
   * Subtree default for `container`, from the nearest `Draggable.PreviewProvider`.
   * Wired by the React layer, which is the only thing that can see a provider; the
   * preview's own `container` wins over it.
   * @internal
   */
  previewContainerDefault?: DragPreviewContainer | undefined;

  /**
   * Event handler called once at the start of a drag, before `onDragStart`,
   * while the preview is being built. The React layer installs its preview
   * publisher here, so the public parameter types omit it.
   * @internal
   */
  onGenerateDragPreview?:
    ((parameters: DragPreviewRenderEvent<NoInfer<TData>>) => void) | undefined;
  /**
   * Event handler called once, synchronously when the drag starts. The drag preview
   * has already been resolved by then, so it is safe to measure or restyle the
   * source from here.
   */
  onDragStart?:
    | ((
        parameters: DragEventMap<NoInfer<TData>>['onDragStart'],
        eventDetails: DragEventDetailsMap['onDragStart'],
      ) => void)
    | undefined;
  /**
   * Event handler called as the pointer moves or a modifier key changes, limited
   * to one call per animation frame. Drop target stack changes do not call this handler.
   * Use the drop target's `onDrag` for hover behavior.
   */
  onDrag?:
    | ((
        parameters: DragEventMap<NoInfer<TData>>['onDrag'],
        eventDetails: DragEventDetailsMap['onDrag'],
      ) => void)
    | undefined;
  /**
   * Event handler called when the active drop targets change,
   * because one was entered or left.
   */
  onDropTargetChange?:
    | ((
        parameters: DragEventMap<NoInfer<TData>>['onDropTargetChange'],
        eventDetails: DragEventDetailsMap['onDropTargetChange'],
      ) => void)
    | undefined;
  /**
   * Event handler called when the drag is released over an accepting drop target.
   * Commit the move here. `dropTarget` is never `null`. A drag that ends another
   * way calls only `onDragEnd`.
   */
  onDrop?:
    | ((
        parameters: DragEventMap<NoInfer<TData>>['onDrop'],
        eventDetails: DragEventDetailsMap['onDrop'],
      ) => void)
    | undefined;
  /**
   * Event handler called once when the drag ends after a drop, outside release, or
   * cancellation. Use it to clean up or revert optimistic state. Commit a drop from
   * `onDrop`. `eventDetails.reason` identifies the outcome.
   */
  onDragEnd?:
    | ((
        parameters: DragEventMap<NoInfer<TData>>['onDragEnd'],
        eventDetails: DragEventDetailsMap['onDragEnd'],
      ) => void)
    | undefined;
};

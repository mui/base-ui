import type {
  DragCleanupFn,
  DragHandle,
  DragKind,
  MoveStartContext,
  DraggablePayload,
  DragPreviewParameters,
  BeforeMoveStartEventDetails,
  DraggableEventDetailsMap,
  DraggableEventMap,
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
    // Some CSS properties are unavailable in jsdom or other browser engines.
    // Restore those to an empty string instead of assigning undefined.
    const previous = {
      touchAction: gestureStyle.touchAction ?? '',
      userSelect: gestureStyle.userSelect ?? '',
      webkitUserSelect: gestureStyle.webkitUserSelect ?? '',
      webkitTouchCallout: gestureStyle.webkitTouchCallout ?? '',
    };
    const priorities = {
      touchAction: gestureStyle.getPropertyPriority('touch-action'),
      userSelect: gestureStyle.getPropertyPriority('user-select'),
      webkitUserSelect: gestureStyle.getPropertyPriority('-webkit-user-select'),
      webkitTouchCallout: gestureStyle.getPropertyPriority('-webkit-touch-callout'),
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
          if (priorities.touchAction) {
            gestureStyle.setProperty('touch-action', previous.touchAction, priorities.touchAction);
          }
        }
        if (gestureStyle.userSelect === 'none') {
          gestureStyle.userSelect = previous.userSelect;
          if (priorities.userSelect) {
            gestureStyle.setProperty('user-select', previous.userSelect, priorities.userSelect);
          }
        }
        if (gestureStyle.webkitUserSelect === 'none') {
          gestureStyle.webkitUserSelect = previous.webkitUserSelect;
          if (priorities.webkitUserSelect) {
            gestureStyle.setProperty(
              '-webkit-user-select',
              previous.webkitUserSelect,
              priorities.webkitUserSelect,
            );
          }
        }
        if (gestureStyle.webkitTouchCallout === 'none') {
          gestureStyle.webkitTouchCallout = previous.webkitTouchCallout;
          if (priorities.webkitTouchCallout) {
            gestureStyle.setProperty(
              '-webkit-touch-callout',
              previous.webkitTouchCallout,
              priorities.webkitTouchCallout,
            );
          }
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

export type DraggableConfig<TPayload = undefined, TDragData = unknown> = {
  element: HTMLElement;
  /** CSP nonce for the drag cursor stylesheet, wired by the React layer. @internal */
  styleNonce?: string | undefined;
  /** Whether the React layer has disabled runtime style elements. @internal */
  disableStyleElements?: boolean | undefined;
  /**
   * The data attached to this item, available as `source.payload` in every drag
   * event and drop target handler.
   */
  // Optional here so the conditional requirement lives in one place: `Draggable.Root`
  // and `registerDraggable` re-impose it through an overload, which also keeps a
  // wrapper spreading their `Props` from hitting a deferred conditional.
  payload?: DraggablePayload<TPayload> | undefined;
  /**
   * A stable key that lets the settling preview find this item again after it remounts,
   * for example when a virtualized or reordered list recreates it.
   * Use the same key for the same item.
   */
  previewKey?: string | number | undefined;
  /**
   * The kind of this item, created with `Draggable.createKind`. Drop targets and
   * monitors list the kinds they accept in `accept`. It determines the type of `payload`.
   */
  kind: DragKind<TPayload, TDragData>;
  /**
   * The element that must be pressed to start a drag. Accepts an element, a ref,
   * or a function returning one. It should exist when the item is registered.
   *
   * For sources registered with `registerDraggable`. `<Draggable.Root>` uses
   * `<Draggable.Handle>` instead.
   */
  dragHandle?: DragHandle | undefined;
  /**
   * Whether dragging is disabled. Pointer presses keep their normal behavior.
   * Use `onBeforeMoveStart` when the decision depends on the gesture.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Event handler called just before a drag starts, once the activation threshold is met.
   * Call `eventDetails.cancel()` to prevent the drag.
   */
  onBeforeMoveStart?:
    | ((
        context: MoveStartContext<NoInfer<TPayload>, NoInfer<TDragData>>,
        eventDetails: BeforeMoveStartEventDetails,
      ) => void)
    | undefined;
  /**
   * Determines when a pointer press starts a drag. Accepts one activation method for
   * every pointer type, a map with a method per pointer type, or an array to allow
   * several methods. By default, mouse and pen start after 5px of movement, and touch
   * after a 250ms hold. Set a pointer entry to `false` to disable pickup for that
   * pointer type, overriding all methods in an array.
   */
  activation?: DragActivationConfig | readonly DragActivationConfig[] | undefined;
  /**
   * One or more modifiers that constrain the drag, applied in order.
   * They affect both the preview and the drop position.
   * See [Constraining movement](https://base-ui.com/react/utils/draggable#constraining-movement).
   */
  modifiers?: DragModifiers | undefined;
  /**
   * The CSS cursor shown across the document during a mouse or pen drag.
   * Pass `false` to manage the cursor yourself.
   * @default 'grabbing'
   */
  dragCursor?: string | false | undefined;
  /**
   * The drag preview of this item. Omit it to use a clone of the source.
   *
   * For sources registered with `registerDraggable`. `<Draggable.Root>` uses
   * `<Draggable.Preview>` instead.
   */
  dragPreview?: DragPreviewParameters<NoInfer<TPayload>, NoInfer<TDragData>> | undefined;
  /**
   * The preview part declared for this draggable, if any. Wired by the React layer;
   * the engine reads it once at drag start, before React can run, to decide between
   * cloning the source and building a host for custom content.
   * @internal
   */
  getDragPreviewDeclaration?:
    (() => DragPreviewDeclaration<NoInfer<TPayload>, NoInfer<TDragData>> | null) | undefined;
  /**
   * Event handler called once at the start of a drag, before `onMoveStart`,
   * while the preview is being built. The React layer installs its preview
   * publisher here, so the public parameter types omit it.
   * @internal
   */
  onGenerateDragPreview?:
    | ((parameters: DragPreviewRenderEvent<NoInfer<TPayload>, NoInfer<TDragData>>) => void)
    | undefined;
  /**
   * Event handler called once when the drag starts. The preview exists by then,
   * so the source can be measured or restyled safely.
   */
  onMoveStart?:
    | ((
        parameters: DraggableEventMap<NoInfer<TPayload>, NoInfer<TDragData>>['onMoveStart'],
        eventDetails: DraggableEventDetailsMap['onMoveStart'],
      ) => void)
    | undefined;
  /**
   * Event handler called as the pointer moves or a modifier key changes,
   * at most once per animation frame. Use a drop target's `onDraggableMove`
   * for hover feedback.
   */
  onMove?:
    | ((
        parameters: DraggableEventMap<NoInfer<TPayload>, NoInfer<TDragData>>['onMove'],
        eventDetails: DraggableEventDetailsMap['onMove'],
      ) => void)
    | undefined;
  /**
   * Event handler called when the drop targets under the pointer change.
   */
  onTargetChange?:
    | ((
        parameters: DraggableEventMap<NoInfer<TPayload>, NoInfer<TDragData>>['onTargetChange'],
        eventDetails: DraggableEventDetailsMap['onTargetChange'],
      ) => void)
    | undefined;
  /**
   * Event handler called once when the drag ends, after a drop, a release outside any
   * target, or a cancellation. `eventDetails.reason` is `'drop'` for a successful drop.
   *
   * A drag canceled during pickup fires this handler without a preceding `onMoveStart`.
   */
  onMoveEnd?:
    | ((
        parameters: DraggableEventMap<NoInfer<TPayload>, NoInfer<TDragData>>['onMoveEnd'],
        eventDetails: DraggableEventDetailsMap['onMoveEnd'],
      ) => void)
    | undefined;
};

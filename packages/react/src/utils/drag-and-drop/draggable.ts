import type { DraggableKind } from '../../draggable/DraggableProvider';
import type { DraggableHandleReference } from '../../draggable/handle/DraggableHandle';
import type {
  DraggablePreviewRenderParameters,
  DraggablePreviewParameters,
} from '../../draggable/preview/DraggablePreview';
import type {
  DraggableRootBeforeMoveStartEventDetails,
  DraggableRootBeforeMoveStartValue,
  DraggableRootMoveEndEventDetails,
  DraggableRootMoveEndValue,
  DraggableRootMoveEventDetails,
  DraggableRootMoveStartEventDetails,
  DraggableRootMoveStartValue,
  DraggableRootMoveValue,
  DraggableRootTargetChangeEventDetails,
  DraggableRootTargetChangeValue,
  DraggableRootModifiers,
  DraggableRootActivationConfig,
} from '../../draggable/root/DraggableRoot';
import type { DragCleanupFn, DraggablePayload } from './types';
import type { DragPreviewDeclaration } from './dragPreviewDeclaration';
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

/** The inline styles that make an element pick up pointer gestures instead of the browser. */
const GESTURE_STYLES = [
  { property: 'touchAction', cssName: 'touch-action', value: 'manipulation' },
  { property: 'userSelect', cssName: 'user-select', value: 'none' },
  { property: 'webkitUserSelect', cssName: '-webkit-user-select', value: 'none' },
  { property: 'webkitTouchCallout', cssName: '-webkit-touch-callout', value: 'none' },
] as const;

interface DraggableStaticSetupParameters {
  element: HTMLElement;
  handle?: DraggableHandleReference | undefined;
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
    // Read every previous value before writing any: `userSelect` and
    // `webkitUserSelect` alias each other in some engines. Some properties are
    // unavailable in jsdom or other engines; restore those to an empty string
    // instead of assigning undefined.
    const saved = GESTURE_STYLES.map((declaration) => ({
      ...declaration,
      previous: gestureStyle[declaration.property] ?? '',
      priority: gestureStyle.getPropertyPriority(declaration.cssName),
    }));
    for (const { property, value } of saved) {
      gestureStyle[property] = value;
    }
    entry = {
      count: 0,
      restore() {
        for (const { property, cssName, value, previous, priority } of saved) {
          // Left alone when a consumer wrote something else since.
          if (gestureStyle[property] !== value) {
            continue;
          }
          gestureStyle[property] = previous;
          if (priority) {
            gestureStyle.setProperty(cssName, previous, priority);
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
  /** The node the gesture styles land on: the handle when there is one, else the element. */
  const resolveGestureElement = (dragHandle: DraggableHandleReference | undefined): HTMLElement =>
    (resolveElementReference(dragHandle, undefined) as HTMLElement | null) ?? element;
  let appliedDisabled = Boolean(parameters.disabled);
  let appliedElement = resolveGestureElement(parameters.handle);
  let releaseSetup = applyGestureSetup(appliedElement, parameters.disabled);

  const refreshFromRegistration = () => {
    const getParameters = getRegistration(element);
    if (getParameters === undefined) {
      return;
    }
    const latest = getParameters();
    const nextDisabled = Boolean(latest.disabled);
    const nextElement = resolveGestureElement(latest.handle);
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
  // Optional here so the requirement lives at the public boundaries:
  // `Draggable.Root.Props` re-imposes it with a conditional type, and
  // `registerSource` with an overload.
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
  kind: DraggableKind<TPayload, TDragData>;
  /**
   * The element that must be pressed to start a drag. Accepts an element, a ref,
   * or a function returning one. It should exist when the item is registered.
   *
   * For sources registered with `registerSource`. `<Draggable.Root>` uses
   * `<Draggable.Handle>` instead.
   */
  handle?: DraggableHandleReference | undefined;
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
        value: DraggableRootBeforeMoveStartValue<NoInfer<TPayload>, NoInfer<TDragData>>,
        eventDetails: DraggableRootBeforeMoveStartEventDetails,
      ) => void)
    | undefined;
  /**
   * Determines when a pointer press starts a drag. Accepts one activation method for
   * every pointer type, a map with a method per pointer type, or an array to allow
   * several methods. By default, mouse and pen start after 5px of movement, and touch
   * after a 250ms hold. Set a pointer entry to `false` to disable pickup for that
   * pointer type, overriding all methods in an array.
   */
  activation?: DraggableRootActivationConfig | readonly DraggableRootActivationConfig[] | undefined;
  /**
   * One or more modifiers that constrain the drag, applied in order.
   * They affect both the preview and the drop position.
   * See [Constraining movement](https://base-ui.com/react/utils/draggable#constraining-movement).
   */
  modifiers?: DraggableRootModifiers | undefined;
  /**
   * The CSS cursor shown across the document during a mouse or pen drag.
   * Pass `false` to manage the cursor yourself.
   * @default 'grabbing'
   */
  dragCursor?: string | false | undefined;
  /**
   * The drag preview of this item. Omit it to use a clone of the source.
   *
   * For sources registered with `registerSource`. `<Draggable.Root>` uses
   * `<Draggable.Preview>` instead.
   */
  preview?: DraggablePreviewParameters<NoInfer<TPayload>, NoInfer<TDragData>> | undefined;
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
    | ((
        parameters: DraggablePreviewRenderParameters<NoInfer<TPayload>, NoInfer<TDragData>>,
      ) => void)
    | undefined;
  /**
   * Event handler called once when the drag starts. The preview exists by then,
   * so the source can be measured or restyled safely.
   */
  onMoveStart?:
    | ((
        value: DraggableRootMoveStartValue<NoInfer<TPayload>, NoInfer<TDragData>>,
        eventDetails: DraggableRootMoveStartEventDetails,
      ) => void)
    | undefined;
  /**
   * Event handler called as the pointer moves or a modifier key changes,
   * at most once per animation frame. Use a drop target's `onDraggableMove`
   * for hover feedback.
   */
  onMove?:
    | ((
        value: DraggableRootMoveValue<NoInfer<TPayload>, NoInfer<TDragData>>,
        eventDetails: DraggableRootMoveEventDetails,
      ) => void)
    | undefined;
  /**
   * Event handler called when the drop targets under the pointer change, including when
   * the drag ends. Cancel-specific cleanup belongs in `onMoveEnd`, whose
   * `eventDetails.canceled` flags a cancel.
   */
  onTargetChange?:
    | ((
        value: DraggableRootTargetChangeValue<NoInfer<TPayload>, NoInfer<TDragData>>,
        eventDetails: DraggableRootTargetChangeEventDetails,
      ) => void)
    | undefined;
  /**
   * Event handler called once when the drag ends, after a drop, a release outside any
   * target, or a cancellation. `target` is the target that received the drop, or `null`.
   * `eventDetails.canceled` tells a cancel from a release, and `eventDetails.reason` says
   * exactly why the drag ended.
   *
   * A drag canceled during pickup fires this handler without a preceding `onMoveStart`.
   */
  onMoveEnd?:
    | ((
        value: DraggableRootMoveEndValue<NoInfer<TPayload>, NoInfer<TDragData>>,
        eventDetails: DraggableRootMoveEndEventDetails,
      ) => void)
    | undefined;
};

import { NOOP } from '@base-ui/utils/empty';
import type { DraggableKind } from '../../draggable/DraggableProvider';
import type { DraggableHandleReference } from '../../draggable/handle/DraggableHandle';
import type {
  DraggablePreviewRenderParameters,
  DraggablePreviewParameters,
} from '../../draggable/preview/DraggablePreview';
import type {
  DraggableRootBeforeMoveStartEventDetails,
  DraggableRootMoveEndEventDetails,
  DraggableRootMoveEventDetails,
  DraggableRootMoveStartEventDetails,
  DraggableRootTargetChangeEventDetails,
  DraggableRootModifiers,
  DraggableRootActivationConfig,
} from '../../draggable/root/DraggableRoot';
import type { DragCleanupFn, DraggablePayload } from './types';
import type { DragPreviewDeclaration } from './dragPreviewDeclaration';
import { bindPointerListeners, unbindPointerListeners } from './synthetic/syntheticSensor';
import { overrideInlineStyles } from './synthetic/dragRootLock';
import type { InlineStyleOverride } from './synthetic/dragRootLock';
import { getSharedSlot } from './sharedState';
import { getDragEventRoot, onceCleanup } from './utils';
import { resolveDragHandle } from './draggableRegistry';

interface GestureSetupEntry {
  count: number;
  restore: () => void;
}

const gestureSetups = getSharedSlot<WeakMap<Element, GestureSetupEntry>>(
  'draggable.gestureSetups',
  () => new WeakMap<Element, GestureSetupEntry>(),
);

/** The inline styles that stop the browser from handling pointer gestures on an element. */
const GESTURE_STYLES: readonly InlineStyleOverride[] = [
  { property: 'touchAction', cssName: 'touch-action', value: 'manipulation' },
  { property: 'userSelect', cssName: 'user-select', value: 'none' },
  { property: 'webkitUserSelect', cssName: '-webkit-user-select', value: 'none' },
  { property: 'webkitTouchCallout', cssName: '-webkit-touch-callout', value: 'none' },
];

/**
 * Apply pointer gesture styles to one element, or to none for `null`. The setup
 * is ref-counted because multiple registrations can share a node.
 */
function applyGestureSetup(gestureElement: HTMLElement | null): DragCleanupFn {
  if (gestureElement === null) {
    return NOOP;
  }

  let entry = gestureSetups.get(gestureElement);
  if (!entry) {
    entry = { count: 0, restore: overrideInlineStyles(gestureElement, GESTURE_STYLES) };
    gestureSetups.set(gestureElement, entry);
  }
  entry.count += 1;
  return onceCleanup(() => {
    entry.count -= 1;
    if (entry.count === 0) {
      gestureSetups.delete(gestureElement);
      entry.restore();
    }
  });
}

export interface DraggableStaticSetup {
  /**
   * Move the gesture styles to match the latest parameters. The draggable
   * registry calls it on each pointer press inside the element (see
   * `resolveDraggablePickup`).
   */
  refresh: (latest: Pick<DraggableConfig<any, any>, 'handle' | 'disabled'>) => void;
  /** Restore the styles. */
  release: DragCleanupFn;
}

/**
 * Apply pointer gesture styles from the parameters read at registration. The
 * returned `refresh` re-applies them from the live registration, which keeps
 * imperative registrations correct when `disabled` or the resolved handle
 * changes without re-registration.
 */
export function applyDraggableStaticSetup(
  parameters: Pick<DraggableConfig, 'element' | 'handle' | 'disabled'>,
): DraggableStaticSetup {
  const { element } = parameters;
  /**
   * The node that gets the gesture styles. It is the handle when there is one,
   * otherwise the element, and none while disabled.
   */
  const resolveGestureElement = (latest: Pick<DraggableConfig<any, any>, 'handle' | 'disabled'>) =>
    latest.disabled ? null : ((resolveDragHandle(latest) as HTMLElement | null) ?? element);
  let appliedElement = resolveGestureElement(parameters);
  let releaseSetup = applyGestureSetup(appliedElement);
  let released = false;

  return {
    refresh(latest) {
      if (released) {
        return;
      }
      const nextElement = resolveGestureElement(latest);
      if (nextElement === appliedElement) {
        return;
      }
      releaseSetup();
      appliedElement = nextElement;
      releaseSetup = applyGestureSetup(nextElement);
    },
    release: onceCleanup(() => {
      released = true;
      releaseSetup();
    }),
  };
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
  /** CSP nonce for the drag cursor stylesheet, set by the React layer. @internal */
  styleNonce?: string | undefined;
  /** Whether the React layer has disabled runtime style elements. @internal */
  disableStyleElements?: boolean | undefined;
  /**
   * The data attached to this item, available as `source.payload` wherever the item is
   * passed to your code: on the event details of every drag handler, in a drop target's
   * `canDrop`, and in the preview. Its type comes from `kind`, and it is required when
   * the kind declares one.
   */
  // Optional here because the public types enforce it. `Draggable.Root.Props`
  // uses a conditional type, and `registerSource` an overload.
  payload?: DraggablePayload<TPayload> | undefined;
  /**
   * A stable key that lets the settling preview find this item again after it remounts,
   * for example when a drop moves it to another list or a virtualized list recreates it.
   * Needed only when the remounted item gets a new `payload` object.
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
        eventDetails: DraggableRootBeforeMoveStartEventDetails<
          NoInfer<TPayload>,
          NoInfer<TDragData>
        >,
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
   * The preview part declared for this draggable, if any. Set by the React layer.
   * The engine reads it once at drag start, before React can run, to decide between
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
        eventDetails: DraggableRootMoveStartEventDetails<NoInfer<TPayload>, NoInfer<TDragData>>,
      ) => void)
    | undefined;
  /**
   * Event handler called as the pointer moves or a modifier key changes,
   * at most once per animation frame. Use a drop target's `onDraggableMove`
   * for hover feedback.
   */
  onMove?:
    | ((eventDetails: DraggableRootMoveEventDetails<NoInfer<TPayload>, NoInfer<TDragData>>) => void)
    | undefined;
  /**
   * Event handler called when the drop targets under the pointer change, including when
   * the drag ends. Cancel-specific cleanup belongs in `onMoveEnd`, whose
   * `eventDetails.canceled` flags a cancel.
   */
  onTargetChange?:
    | ((
        eventDetails: DraggableRootTargetChangeEventDetails<NoInfer<TPayload>, NoInfer<TDragData>>,
      ) => void)
    | undefined;
  /**
   * Event handler called once when the drag ends, after a drop, a release outside any
   * target, or a cancellation. `eventDetails.target` is the target that received the drop,
   * or `null`. `eventDetails.canceled` tells a cancel from a release, and
   * `eventDetails.reason` says exactly why the drag ended.
   *
   * A drag canceled during pickup fires this handler without a preceding `onMoveStart`.
   */
  onMoveEnd?:
    | ((
        eventDetails: DraggableRootMoveEndEventDetails<NoInfer<TPayload>, NoInfer<TDragData>>,
      ) => void)
    | undefined;
};

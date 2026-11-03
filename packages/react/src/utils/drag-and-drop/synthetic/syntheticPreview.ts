import { clamp } from '@base-ui/utils/clamp';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { contains } from '@base-ui/utils/shadowDom';
import { getFiniteAnimations } from '../../getFiniteAnimations';
import { WindowAnimationFrame } from '../../windowAnimationFrame';
import { WindowTimeout } from '../../windowTimeout';
import type { DraggableInput, DraggablePosition } from '../../../draggable/DraggableProvider';
import type {
  DraggablePositionerOffset,
  DraggablePositionerOffsetParameters,
} from '../../../draggable/positioner/DraggablePositioner';
import type {
  DraggableRootModifier,
  DraggableRootModifiers,
} from '../../../draggable/root/DraggableRoot';
import type { DragModifierKeys } from '../utils';
import { applyDragModifiers, compileDragModifiers, ZERO_OFFSET } from '../dragModifiers';
import { getSharedSlot } from '../sharedState';
import { setSourceSettling } from '../settlingSources';
import { getActiveSession } from '../core/dragSession';
import { retargetDragSource } from '../dragSource';
import * as DraggablePositionerDataAttributes from '../../../draggable/positioner/DraggablePositionerDataAttributes';
import * as DraggablePreviewDataAttributes from '../../../draggable/preview/DraggablePreviewDataAttributes';
import * as DraggableTriggerDataAttributes from '../../../draggable/trigger/DraggableTriggerDataAttributes';
import {
  containConsumerError,
  getComposedParentElement,
  getElementScale,
  getElementZoom,
  NO_MODIFIER_KEYS,
} from '../utils';

/** What `getElementScale` reports for an element with no ancestor transform. */
const DEFAULT_SCALE: DraggablePosition = { x: 1, y: 1 };
const MIN_SETTLING_WATCHDOG_MS = 1000;
const MAX_SETTLING_WATCHDOG_MS = 30000;

export interface SyntheticPreviewSourceIdentity {
  kind: symbol;
  previewKey: string | number | undefined;
  /** The declared payload, used to reconnect the preview after a source remounts. */
  payload: unknown;
  /** The `Draggable.Root` instance, which keeps it across a node swap. */
  owner?: object | undefined;
}

/**
 * The identity of a draggable's source, from its parameters. Registration and pickup
 * build it the same way, so a remounted source finds the drag and the preview it left.
 */
export function getPreviewSourceIdentity(
  parameters: {
    kind: { id: symbol };
    previewKey?: string | number | undefined;
    payload?: unknown;
  },
  owner: object | undefined,
): SyntheticPreviewSourceIdentity {
  return {
    kind: parameters.kind.id,
    previewKey: parameters.previewKey,
    payload: parameters.payload,
    owner,
  };
}

function isSameSource(
  left: SyntheticPreviewSourceIdentity,
  right: SyntheticPreviewSourceIdentity,
): boolean {
  return (
    left.kind === right.kind &&
    ((right.owner !== undefined && left.owner === right.owner) ||
      (right.payload !== undefined && Object.is(left.payload, right.payload)) ||
      (right.previewKey !== undefined && Object.is(left.previewKey, right.previewKey)))
  );
}

/** A released preview still running its drop transition onto `source`. */
interface EndingPreview {
  identity: SyntheticPreviewSourceIdentity;
  readonly source: Element;
  retarget(element: HTMLElement): void;
  finish(): void;
}

// Previews still running their drop transition. A new pickup from the same source
// interrupts the previous one. Shared across bundles, like the active drag state.
const endingPreviews = getSharedSlot('dragPreview.ending', () => new Set<EndingPreview>());

// The previews a `Draggable.Positioner` can attach to: the active drag's, and those
// still settling after a drop.
const livePreviews = getSharedSlot('dragPreview.live', () => new Set<DragPreview>());

/** Whether a transition with a duration covers `translate`. */
function transitionsTranslate(style: CSSStyleDeclaration): boolean {
  const durations = style.transitionDuration.split(',');
  return style.transitionProperty
    .split(',')
    .some(
      (name, index) =>
        (name.trim() === 'all' || name.trim() === 'translate') &&
        Number.parseFloat(durations[index % durations.length]) > 0,
    );
}

function findEndingPreview(source: Element): EndingPreview | undefined {
  for (const entry of endingPreviews) {
    if (entry.source === source) {
      return entry;
    }
  }
  return undefined;
}

/**
 * Finish previews settling onto the source or its descendants before pickup.
 * Their state attributes affect measurement.
 */
export function finishEndingPreview(source: Element): void {
  for (const entry of endingPreviews) {
    if (contains(source, entry.source)) {
      entry.finish();
    }
  }
}

/**
 * Finish every settling preview. Test-only, so a test that ends right after a drop
 * does not leave its preview in the document for the next one.
 */
export function finishAllEndingPreviewsForTests(): void {
  for (const entry of Array.from(endingPreviews)) {
    entry.finish();
  }
}

/** The preview of the drag from `source`, active or settling, or `null`. */
export function findDragPreview(source: Element): DragPreview | null {
  let found: DragPreview | null = null;
  for (const preview of livePreviews) {
    if (preview.getSourceElement() === source) {
      // The latest one, since a new pickup finishes the previous preview first.
      found = preview;
    }
  }
  return found;
}

/**
 * Point the drag in progress, or a settling preview, at a draggable that just registered
 * as the same source, such as a row a virtualizer or a cross-list move remounted.
 * Only a source whose node left the document is moved.
 */
export function retargetPreviewSource(
  element: HTMLElement,
  identity: SyntheticPreviewSourceIdentity,
): void {
  const session = getActiveSession();
  if (
    session?.preview &&
    !session.source.element.isConnected &&
    isSameSource(session.preview.identity, identity)
  ) {
    retargetDragSource(session.source.element, element);
    return;
  }
  for (const entry of endingPreviews) {
    if (!entry.source.isConnected && isSameSource(entry.identity, identity)) {
      entry.retarget(element);
      return;
    }
  }
}

/** The settings a `Draggable.Positioner` attaches with. */
export interface PreviewAttachSettings {
  offset: DraggablePositionerOffset | undefined;
  modifiers: DraggableRootModifiers | undefined;
}

/**
 * Resolve a `DraggablePositionerOffset` into the offset from the preview's top-left
 * corner to the pointer. The default `'source'` keeps the grab point, so the preview
 * lifts off where the source sits.
 */
function resolveOffset(
  offset: DraggablePositionerOffset | undefined,
  parameters: DraggablePositionerOffsetParameters,
): DraggablePosition {
  if (offset === 'pointer') {
    return { x: 0, y: 0 };
  }
  if (offset === undefined || offset === 'source') {
    return {
      x: parameters.input.clientX - parameters.sourceRect.left,
      y: parameters.input.clientY - parameters.sourceRect.top,
    };
  }
  if (typeof offset === 'function') {
    return offset(parameters);
  }
  return offset;
}

/**
 * The element the engine moves: a `Draggable.Positioner`, or the copy it leaves when
 * its root unmounts mid-drag. Positions are those of `content`, the
 * `Draggable.Preview` inside it, which is the box the user sees.
 */
interface PositionedPreview {
  readonly element: HTMLElement;
  readonly content: HTMLElement;
  /** Whether the engine created the element and removes it. React owns the rest. */
  readonly owned: boolean;
  /** Move the content's top-left corner to these viewport coordinates. */
  setPosition(x: number, y: number): void;
  /** Re-measure the content's offset inside the element, which may have changed. */
  measure(): void;
  /** Re-home an engine-owned copy whose parent was removed. */
  ensureConnected(): void;
  destroy(): void;
}

function createPositionedPreview(
  element: HTMLElement,
  content: HTMLElement,
  owned: boolean,
): PositionedPreview {
  // Where an owned copy goes when its parent is removed, nearest first.
  const hosts: Element[] = [];
  for (
    let node: Element | null = element.parentElement;
    node;
    node = getComposedParentElement(node)
  ) {
    hosts.push(node);
  }
  // `zoom` on the element and its ancestors scales `translate`.
  let zoom = 1;
  // The content's top-left corner relative to the element's, in viewport pixels.
  let contentOffset = ZERO_OFFSET;
  let position: DraggablePosition | null = null;

  function writePosition() {
    if (position) {
      const x = (position.x - contentOffset.x) / zoom;
      const y = (position.y - contentOffset.y) / zoom;
      element.style.setProperty('translate', `${x}px ${y}px`);
    }
  }

  const handle: PositionedPreview = {
    element,
    content,
    owned,
    setPosition(x, y) {
      position = { x, y };
      writePosition();
    },
    measure() {
      zoom = getElementZoom(element);
      if (content === element) {
        contentOffset = ZERO_OFFSET;
      } else {
        const outer = element.getBoundingClientRect();
        const inner = content.getBoundingClientRect();
        contentOffset = { x: inner.left - outer.left, y: inner.top - outer.top };
      }
      writePosition();
    },
    ensureConnected() {
      if (owned && !element.isConnected) {
        const doc = ownerDocument(element);
        (hosts.find((node) => node.isConnected) ?? doc.body ?? doc.documentElement).appendChild(
          element,
        );
      }
    },
    destroy() {
      if (owned) {
        element.remove();
      }
    },
  };
  handle.measure();
  return handle;
}

/** The pickup state a preview resolves its offset from. */
export interface DragPreviewPickup {
  /** The source's bounding rect at pickup. */
  sourceRect: DOMRect;
  /** The input the drag started with. */
  input: DraggableInput;
  /**
   * The input at the press. The `'source'` offset uses it rather than `input`: distance
   * activation commits on a later `pointermove`, so the preview would otherwise shift in
   * the gesture's direction.
   */
  pressInput: DraggableInput;
}

/** Build a pickup's preview and mark the source as dragged. */
export function createDragPreview(
  source: HTMLElement,
  identity: SyntheticPreviewSourceIdentity,
  pickup: DragPreviewPickup,
): DragPreview {
  const preview = createSyntheticPreview(source, identity, pickup);
  preview.markSourceDragging();
  return preview;
}

/**
 * The preview of one drag. It has no element until a `Draggable.Positioner` attaches,
 * and a drag without one shows no preview.
 */
export function createSyntheticPreview(
  initialSourceElement: HTMLElement,
  sourceIdentity: SyntheticPreviewSourceIdentity,
  pickup: DragPreviewPickup,
): DragPreview {
  // Re-pointed when a virtualizer remounts the dragged item to a new node, so the
  // drag-state attribute follows the live element, as `Draggable.Root`'s `dragging` does.
  let sourceElement = initialSourceElement;
  let destroyed = false;
  let preparedForDrop = false;
  // Whether the release dropped on a target.
  let dropped = false;
  // Whether the released preview is still running its drop transition.
  let settling = false;
  // Whether the drop transition started, after which the element can't be swapped.
  let endingStarted = false;
  // Whether the preview is gone for good.
  let finished = false;

  let current: PositionedPreview | null = null;
  // Assigned below, and read by the functions that end it.
  let preview: DragPreview;
  // Resolved when the first positioner attaches, from its settings.
  let modifiers: ReadonlyArray<DraggableRootModifier> | null = null;
  let offsetResolved = false;
  let previewOffset = ZERO_OFFSET;
  let lastX = 0;
  let lastY = 0;
  let hasPosition = false;
  // The proposed top-left on the first frame, which preview axis locks and grids snap
  // against.
  let initialProposed: DraggablePosition | null = null;
  // The content's ancestor scale, read lazily for modifiers once it renders.
  let previewScale: DraggablePosition | null = null;
  // The modifier keys of the latest positioning event, stored because a late attach
  // positions the preview without an event.
  let lastKeys: DragModifierKeys = NO_MODIFIER_KEYS;

  function positionPreviewElement(): void {
    if (!current || !hasPosition) {
      return;
    }
    const target = current;
    target.ensureConnected();
    let proposedX = lastX - previewOffset.x;
    let proposedY = lastY - previewOffset.y;
    initialProposed ??= { x: proposedX, y: proposedY };
    if (modifiers) {
      if (previewScale === null && target.content.getClientRects().length > 0) {
        previewScale = getElementScale(target.content);
      }
      const constrained = applyDragModifiers(
        modifiers,
        { x: proposedX, y: proposedY },
        {
          initialPoint: initialProposed,
          input: { x: lastX, y: lastY },
          sourceElement,
          sourceRect: pickup.sourceRect,
          // These modifiers move the preview, so a step in its own units uses the
          // preview's scale, not the source's.
          scale: previewScale ?? DEFAULT_SCALE,
          // `point` is the top-left itself here, so the offset is zero.
          previewOffset: ZERO_OFFSET,
          keys: lastKeys,
          ownerWindow: ownerWindow(target.element),
          getPreviewRect: () => target.content.getBoundingClientRect(),
        },
      );
      if (current !== target) {
        return;
      }
      proposedX = constrained.x;
      proposedY = constrained.y;
    }
    target.setPosition(proposedX, proposedY);
  }

  function setAttributes(target: PositionedPreview) {
    for (const node of new Set([target.element, target.content])) {
      node.toggleAttribute(DraggablePositionerDataAttributes.endingStyle, endingStarted);
      node.toggleAttribute(DraggablePositionerDataAttributes.dropped, endingStarted && dropped);
    }
  }

  function retargetSource(element: HTMLElement): void {
    if (finished || element === sourceElement) {
      return;
    }

    sourceElement.removeAttribute(DraggableTriggerDataAttributes.dragging);
    setSourceSettling(sourceElement, false);
    if (settling) {
      // A fresh drag from the destination can begin before this one settles.
      // It owns that source now, so finish the older preview first.
      findEndingPreview(element)?.finish();
    }

    sourceElement = element;
    sourceElement.setAttribute(DraggableTriggerDataAttributes.dragging, '');
    if (settling) {
      setSourceSettling(sourceElement, true);
    }
  }

  function finish(): void {
    if (finished) {
      return;
    }
    finished = true;
    livePreviews.delete(preview);
    current?.destroy();
    current = null;
    sourceElement.removeAttribute(DraggableTriggerDataAttributes.dragging);
    setSourceSettling(sourceElement, false);
    settling = false;
  }

  function destroy(): void {
    if (destroyed) {
      return;
    }
    destroyed = true;

    // On a drop, the preview stays mounted until the consumer's drop transition
    // finishes. React keeps rendering the positioner while the source settles.
    if (!preparedForDrop || !current) {
      finish();
      return;
    }
    const win = ownerWindow(current.element);
    const frame = new WindowAnimationFrame(win);
    const settlingWatchdog = new WindowTimeout(win);
    const entry: EndingPreview = {
      identity: sourceIdentity,
      get source() {
        return sourceElement;
      },
      retarget: retargetSource,
      finish() {
        if (!endingPreviews.delete(entry)) {
          return;
        }
        frame.cancel();
        settlingWatchdog.clear();
        finish();
      },
    };
    const cleanup = () => entry.finish();

    findEndingPreview(sourceElement)?.finish();
    settling = true;
    endingPreviews.add(entry);
    setSourceSettling(sourceElement, true);

    // Start the ending in the next frame, before paint. The release is resolved by
    // then, so `[data-dropped]` lands with `[data-ending-style]`, and drop
    // handlers' state updates are committed, so the source is in its final slot.
    frame.request(() => {
      const target = current;
      if (!target) {
        cleanup();
        return;
      }
      endingStarted = true;
      target.ensureConnected();
      const element = target.element;
      // Commit the position the drag left the preview at, so an ending transition
      // animates only what changes from here.
      const style = win.getComputedStyle(element);
      void style.translate;
      setAttributes(target);
      // Move to the source only under a `translate` transition, so an ending fade
      // without one runs where the preview was released. Also stay put when the
      // source is gone or renders no box while the preview does (a
      // `[data-dragging] { display: none }` rule), since it would measure as a zero
      // rect at the viewport corner.
      if (
        transitionsTranslate(style) &&
        sourceElement.isConnected &&
        (sourceElement.getClientRects().length > 0 || element.getClientRects().length === 0)
      ) {
        const destination = sourceElement.getBoundingClientRect();
        target.measure();
        target.setPosition(destination.left, destination.top);
      }

      const animations =
        globalThis.BASE_UI_ANIMATIONS_DISABLED || !element.getAnimations
          ? []
          : getFiniteAnimations(element, { subtree: true });
      if (animations.length === 0) {
        cleanup();
        return;
      }
      const longestAnimationMs = animations.reduce((longest, animation) => {
        const endTime = animation.effect?.getComputedTiming?.().endTime;
        return typeof endTime === 'number' && Number.isFinite(endTime)
          ? Math.max(longest, endTime)
          : longest;
      }, 0);
      settlingWatchdog.start(
        clamp(longestAnimationMs + 100, MIN_SETTLING_WATCHDOG_MS, MAX_SETTLING_WATCHDOG_MS),
        cleanup,
      );
      Promise.allSettled(animations.map((animation) => animation.finished)).then(cleanup);
    });
  }

  /** Swap in `next`, positioned where the previous element was. */
  function adopt(next: PositionedPreview): void {
    const previous = current;
    current = next;
    previewScale = null;
    setAttributes(next);
    positionPreviewElement();
    if (previous !== next) {
      previous?.destroy();
    }
  }

  preview = {
    identity: sourceIdentity,
    sourceRect: pickup.sourceRect,
    update(clientX: number, clientY: number, keys: DragModifierKeys = NO_MODIFIER_KEYS): void {
      if (destroyed) {
        return;
      }
      lastX = clientX;
      lastY = clientY;
      lastKeys = keys;
      hasPosition = true;
      positionPreviewElement();
    },
    attach(element, content, settings) {
      if (finished || endingStarted) {
        // Too late to show it. Hidden until React unmounts it with the settled source.
        element.style.setProperty('visibility', 'hidden');
        return () => {};
      }
      if (!offsetResolved) {
        offsetResolved = true;
        modifiers = compileDragModifiers(settings.modifiers);
        const isSourceOffset = settings.offset === undefined || settings.offset === 'source';
        const parameters: DraggablePositionerOffsetParameters = {
          element: content ?? element,
          sourceRect: pickup.sourceRect,
          input: isSourceOffset ? pickup.pressInput : pickup.input,
        };
        // Consumer code. Uncontained, a throw would end the drag from inside the React
        // commit that rendered the positioner.
        previewOffset =
          containConsumerError(
            'Base UI: a drag preview "offset" function threw, so the preview uses the "source" offset.',
            element,
            () => resolveOffset(settings.offset, parameters),
            null,
          ) ?? resolveOffset('source', { ...parameters, input: pickup.pressInput });
      }
      const attached = createPositionedPreview(element, content ?? element, false);
      adopt(attached);
      return () => {
        if (current !== attached || finished) {
          return;
        }
        // The root unmounted mid-drag, as when a virtualizer scrolls the source away or a
        // drop moves it to another list. Keep a copy in place until a remounted root
        // attaches again or the preview settles. React removes the original right after.
        const parent = element.parentNode;
        if (!parent) {
          current = null;
          return;
        }
        const copy = element.cloneNode(true) as HTMLElement;
        parent.insertBefore(copy, element.nextSibling);
        const copyContent =
          attached.content === element
            ? copy
            : (copy.querySelector<HTMLElement>(`[${DraggablePreviewDataAttributes.dragPreview}]`) ??
              copy);
        const frozen = createPositionedPreview(copy, copyContent, true);
        current = frozen;
        // The copy's parent may be removed with the original, such as a portal's node.
        queueMicrotask(() => {
          if (current === frozen) {
            frozen.ensureConnected();
          }
        });
      };
    },
    retargetSource,
    getSourceElement() {
      return sourceElement;
    },
    getPreviewElement(): HTMLElement | null {
      return current?.element ?? null;
    },
    getPreviewRect(): DOMRect | null {
      return current?.content.getBoundingClientRect() ?? null;
    },
    getPreviewOffset(): DraggablePosition {
      return previewOffset;
    },
    markSourceDragging(): void {
      finishEndingPreview(sourceElement);
      sourceElement.setAttribute(DraggableTriggerDataAttributes.dragging, '');
    },
    end(drop: boolean): void {
      if (destroyed) {
        return;
      }
      if (drop) {
        preparedForDrop = true;
        // A preview without an element (none declared, or not rendered yet) has nothing
        // to settle. It is destroyed at session end instead, so `[data-dragging]` rules
        // still apply while drop handlers measure against the layout under the pointer.
        const session = getActiveSession();
        if (current === null && session !== null) {
          void session.onEnd(destroy);
          return;
        }
      }
      destroy();
    },
    markDropped(): void {
      dropped = true;
    },
  };
  livePreviews.add(preview);
  return preview;
}

/** The drag preview, as the sensor, session and React layer use it. */
export interface DragPreview {
  /** The source it was picked up from (see `retargetPreviewSource`). */
  readonly identity: SyntheticPreviewSourceIdentity;
  /** The source's bounding rect at pickup. */
  readonly sourceRect: DOMRect;
  /** `keys` are the modifier keys of the event behind this position, for preview modifiers. */
  update(clientX: number, clientY: number, keys?: DragModifierKeys): void;
  /**
   * Show `element`, a `Draggable.Positioner`, as the preview, and move it with the
   * pointer. `content` is the `Draggable.Preview` inside it, or `null` to position the
   * element itself. The first attach resolves the offset and modifiers from `settings`.
   * Returns the detach, which leaves a copy in place while the drag still needs one.
   */
  attach(
    element: HTMLElement,
    content: HTMLElement | null,
    settings: PreviewAttachSettings,
  ): () => void;
  /** Follow the drag source to a fresh node when a virtualizer remounts it mid-drag. */
  retargetSource(element: HTMLElement): void;
  /** The current source element. */
  getSourceElement(): HTMLElement;
  /** The element the engine moves, which hit-testing skips, or `null` without one. */
  getPreviewElement(): HTMLElement | null;
  /** The visible preview's rect, which rect modifiers contain, or `null` without one. */
  getPreviewRect(): DOMRect | null;
  /** The offset from the visible preview's top-left corner to the cursor. */
  getPreviewOffset(): DraggablePosition;
  /**
   * Mark the source as being dragged. Called at pickup, once the source is measured,
   * so a `[data-dragging]` rule that resizes or hides it can't corrupt the measurement.
   */
  markSourceDragging(): void;
  /**
   * End the preview. On a drop it stays mounted while its ending transition settles
   * onto the source. Otherwise, such as on a cancel, it is removed at once.
   */
  end(drop: boolean): void;
  /** Mark the ending preview as dropped on a target, for `[data-dropped]` styles. */
  markDropped(): void;
}

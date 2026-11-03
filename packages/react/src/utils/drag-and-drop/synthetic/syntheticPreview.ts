import { isShadowRoot } from '@floating-ui/utils/dom';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { clamp } from '@base-ui/utils/clamp';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { contains, getTarget } from '@base-ui/utils/shadowDom';
import { Store } from '@base-ui/utils/store';
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
import { getActiveSession } from '../core/dragSession';
import { retargetDragSource } from '../dragSource';
import * as DraggablePositionerCssVars from '../../../draggable/positioner/DraggablePositionerCssVars';
import * as DraggablePositionerDataAttributes from '../../../draggable/positioner/DraggablePositionerDataAttributes';
import * as DraggablePreviewDataAttributes from '../../../draggable/preview/DraggablePreviewDataAttributes';
import * as DraggableTriggerDataAttributes from '../../../draggable/trigger/DraggableTriggerDataAttributes';
import {
  containConsumerError,
  getElementScale,
  getElementZoom,
  getSubtreeElements,
  NO_MODIFIER_KEYS,
} from '../utils';

/** What `getElementScale` reports for an element with no ancestor transform. */
const DEFAULT_SCALE: DraggablePosition = { x: 1, y: 1 };
const MIN_SETTLING_WATCHDOG_MS = 1000;
const MAX_SETTLING_WATCHDOG_MS = 30000;
const SETTLING_WATCHDOG_GRACE_MS = 100;

/**
 * Where a drag is, as its preview decides it:
 * - `dragging`: from pickup until the release, or until the drag ends without one.
 * - `settling`: after a release, while the preview runs its ending onto the source.
 */
export type DragPhase = 'idle' | 'dragging' | 'settling';

/** A `Draggable.Root`'s drag, as its parts render it. */
export interface RootDrag {
  readonly phase: DragPhase;
  /**
   * The preview of the root's drag, or `null` when idle. Each drag has its own, so its
   * identity tells one drag from the next.
   */
  readonly preview: DragPreview | null;
}

const IDLE_ROOT_DRAG: RootDrag = { phase: 'idle', preview: null };

/**
 * Where the preview publishes its `Draggable.Root`'s drag. It is also the root's identity
 * (see `SyntheticPreviewSourceIdentity.owner`), so a drag finds its root across a node swap.
 */
export type RootDragStore = Store<RootDrag>;

export function createRootDragStore(): RootDragStore {
  return new Store(IDLE_ROOT_DRAG);
}

export interface SyntheticPreviewSourceIdentity {
  kind: symbol;
  previewKey: string | number | undefined;
  /** The declared payload, used to reconnect the preview after a source remounts. */
  payload: unknown;
  /** The `Draggable.Root`'s drag store. `undefined` for a source without a root. */
  owner?: RootDragStore | undefined;
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
  owner: RootDragStore | undefined,
): SyntheticPreviewSourceIdentity {
  return {
    kind: parameters.kind.id,
    previewKey: parameters.previewKey,
    payload: parameters.payload,
    owner,
  };
}

/** Same kind, and the same root, payload, or `previewKey`. An undefined field never matches. */
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

/** A preview's drag, from pickup until it finishes. */
interface LiveDrag {
  readonly phase: DragPhase;
  readonly source: Element;
  readonly identity: SyntheticPreviewSourceIdentity;
  /** Hand the drag over to `element`, a node registered as the same source. */
  retarget(element: HTMLElement, identity: SyntheticPreviewSourceIdentity): void;
  finish(): void;
}

// The active drag's preview, and those still settling after a drop. Shared across
// bundles, like the active drag state.
const liveDrags = getSharedSlot('dragPreview.drags', () => new Set<LiveDrag>());

/** Whether a transition with a duration covers `translate`. */
function transitionsTranslate(style: CSSStyleDeclaration): boolean {
  const durations = style.transitionDuration.split(',');
  // CSS repeats the duration list to match the property list.
  return style.transitionProperty
    .split(',')
    .some(
      (name, index) =>
        (name.trim() === 'all' || name.trim() === 'translate') &&
        Number.parseFloat(durations[index % durations.length]) > 0,
    );
}

/** The engine writes these, so `[data-dragging]` rules apply before React renders. */
function markSource(element: Element, phase: DragPhase): void {
  element.toggleAttribute(DraggableTriggerDataAttributes.dragging, phase !== 'idle');
  element.toggleAttribute(DraggableTriggerDataAttributes.settling, phase === 'settling');
}

function findSettlingDrag(source: Element): LiveDrag | undefined {
  for (const drag of liveDrags) {
    if (drag.phase === 'settling' && drag.source === source) {
      return drag;
    }
  }
  return undefined;
}

/**
 * Finish previews settling onto the source or its descendants before pickup.
 * Their state attributes affect measurement.
 */
export function finishEndingPreview(source: Element): void {
  for (const drag of liveDrags) {
    if (drag.phase === 'settling' && contains(source, drag.source)) {
      drag.finish();
    }
  }
}

/**
 * Finish every settling preview. Test-only, so a test that ends right after a drop
 * does not leave its preview in the document for the next one.
 */
export function finishAllEndingPreviewsForTests(): void {
  for (const drag of Array.from(liveDrags)) {
    if (drag.phase === 'settling') {
      drag.finish();
    }
  }
}

/**
 * Hand the drag in progress, or a settling preview, over to a draggable that just
 * registered as the same source, such as a row a virtualizer or a cross-list move
 * remounted. Only a source whose node left the document is moved.
 */
export function retargetPreviewSource(
  element: HTMLElement,
  identity: SyntheticPreviewSourceIdentity,
): void {
  // Runs on every registration, which almost never has a drag to hand over.
  if (liveDrags.size === 0) {
    return;
  }
  const matches = Array.from(liveDrags).filter(
    (drag) => !drag.source.isConnected && isSameSource(drag.identity, identity),
  );
  // The drag in progress first, then the oldest settling preview.
  (matches.find((drag) => drag.phase === 'dragging') ?? matches[0])?.retarget(element, identity);
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
  /** Where the content's top-left corner was last moved to, in viewport coordinates. */
  readonly position: DraggablePosition | null;
  /** Move the content's top-left corner to these viewport coordinates. */
  setPosition(x: number, y: number): void;
  /** Position `next` instead, keeping its top-left corner where the content's was. */
  setContent(next: HTMLElement): void;
  /** Re-measure the content's offset and the element's zoom, which may have changed. */
  measure(): void;
  /** Re-home an engine-owned copy whose parent was removed. */
  ensureConnected(): void;
  /**
   * Copy the element, which leaves the document right after, with its DOM state.
   * `restoreState` applies the scroll offsets after each insertion of `copy`.
   */
  freeze(): { copy: HTMLElement; restoreState: () => void };
  destroy(): void;
}

function createPositionedPreview(
  element: HTMLElement,
  initialContent: HTMLElement,
  sourceSize: DragPreviewSize,
  // Restores the DOM state of a copy, which inserting it resets. Only a copy the
  // preview owns has one.
  restoreState?: () => void,
): PositionedPreview {
  const owned = restoreState !== undefined;
  let content = initialContent;
  // Where an owned copy goes when its parent is removed, nearest first. Shadow roots are
  // kept, since a copy moved to their host's light DOM isn't rendered without a `<slot>`.
  const hosts: ParentNode[] = [];
  const doc = ownerDocument(element);
  for (
    let node = element.parentNode;
    node && node !== doc;
    node = isShadowRoot(node) ? node.host : node.parentNode
  ) {
    hosts.push(node);
  }
  // `zoom` on the element and its ancestors scales `translate`.
  let zoom = 1;
  // The content's top-left corner relative to the element's, in viewport pixels.
  let contentOffset = ZERO_OFFSET;
  let position: DraggablePosition | null = null;
  // The last scroll offsets inside the element, for `freeze`. A portal's node leaves the
  // document before React detaches the element, which resets them.
  const scrollOffsets = new Map<Element, DraggablePosition>();
  function onScroll(event: Event) {
    const target = getTarget(event) as HTMLElement;
    scrollOffsets.set(target, { x: target.scrollLeft, y: target.scrollTop });
  }
  // Content around the preview, such as a header above it growing, moves it inside the
  // element, which then resizes. A copy doesn't change.
  const win = ownerWindow(element);
  const resizeObserver =
    !owned && typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(measure) : null;
  // A later commit can remove an ancestor of an owned copy while the pointer is still,
  // which mutates no node the copy's own parent sees, so the whole chain is watched.
  const mutationObserver =
    owned && typeof win.MutationObserver === 'function'
      ? new win.MutationObserver(ensureConnected)
      : null;
  for (const node of hosts) {
    mutationObserver?.observe(node, { childList: true });
  }
  let removeScrollListener: (() => void) | null = null;
  if (!owned) {
    removeScrollListener = addEventListener(element, 'scroll', onScroll, true);
    resizeObserver?.observe(element);
    if (content !== element) {
      resizeObserver?.observe(content);
    }
  }

  function measure() {
    zoom = getElementZoom(element);
    // In the element's CSS pixels, so a preview sized with them matches the source.
    element.style.setProperty(
      DraggablePositionerCssVars.dragSourceWidth,
      `${sourceSize.width / zoom}px`,
    );
    element.style.setProperty(
      DraggablePositionerCssVars.dragSourceHeight,
      `${sourceSize.height / zoom}px`,
    );
    if (content === element) {
      contentOffset = ZERO_OFFSET;
    } else {
      const outer = element.getBoundingClientRect();
      const inner = content.getBoundingClientRect();
      contentOffset = { x: inner.left - outer.left, y: inner.top - outer.top };
    }
    writePosition();
  }

  function ensureConnected() {
    if (owned && !element.isConnected) {
      (hosts.find((node) => node.isConnected) ?? doc.body ?? doc.documentElement).appendChild(
        element,
      );
      restoreState?.();
      // The new parent may differ in `zoom` and in the styles the content inherits.
      measure();
    }
  }

  function writePosition() {
    if (position) {
      const x = (position.x - contentOffset.x) / zoom;
      const y = (position.y - contentOffset.y) / zoom;
      element.style.setProperty('translate', `${x}px ${y}px`);
    }
  }

  const handle: PositionedPreview = {
    element,
    get content() {
      return content;
    },
    owned,
    get position() {
      return position;
    },
    setPosition(x, y) {
      position = { x, y };
      writePosition();
    },
    setContent(next) {
      if (content !== element) {
        resizeObserver?.unobserve(content);
      }
      content = next;
      if (content !== element) {
        resizeObserver?.observe(content);
      }
      measure();
    },
    measure,
    ensureConnected,
    freeze() {
      const copy = element.cloneNode(true) as HTMLElement;
      return { copy, restoreState: copyLiveState(element, copy, scrollOffsets) };
    },
    destroy() {
      removeScrollListener?.();
      resizeObserver?.disconnect();
      // Before the removal below, which it would undo.
      mutationObserver?.disconnect();
      if (owned) {
        element.remove();
      }
    },
  };
  measure();
  return handle;
}

/**
 * Copy the DOM state `cloneNode` leaves out: canvas pixels, select selections and
 * `indeterminate`. Also ungroup `<details>` so they stay open. Scroll offsets need layout,
 * so the returned function applies them after each insertion. A node out of the document
 * reads none, so it uses the last ones in `scrollOffsets`.
 */
function copyLiveState(
  source: HTMLElement,
  copy: HTMLElement,
  scrollOffsets: ReadonlyMap<Element, DraggablePosition>,
): () => void {
  const win = ownerWindow(source);
  const copies = getSubtreeElements(copy);
  const scrolls: Array<[node: HTMLElement, offset: DraggablePosition]> = [];
  getSubtreeElements(source).forEach((node, index) => {
    const target = copies[index];
    if (node instanceof win.HTMLCanvasElement && target instanceof win.HTMLCanvasElement) {
      try {
        target.getContext('2d')?.drawImage(node, 0, 0);
      } catch {
        // A tainted or transferred canvas can't be read. The copy stays blank.
      }
    } else if (node instanceof win.HTMLSelectElement && target instanceof win.HTMLSelectElement) {
      // A controlled `value` sets the options' selectedness, not their `selected` attribute.
      Array.from(node.options).forEach((option, optionIndex) => {
        const copyOption = target.options[optionIndex];
        if (copyOption) {
          copyOption.selected = option.selected;
        }
      });
    } else if (node instanceof win.HTMLInputElement && target instanceof win.HTMLInputElement) {
      target.indeterminate = node.indeterminate;
    } else if (target instanceof win.HTMLDetailsElement) {
      // The copy goes in while the original is still in the page, and an open `<details>`
      // that joins a group with another open one closes.
      target.removeAttribute('name');
    }
    const offset = (!node.isConnected && scrollOffsets.get(node)) || {
      x: node.scrollLeft,
      y: node.scrollTop,
    };
    if (target instanceof win.HTMLElement && (offset.x !== 0 || offset.y !== 0)) {
      scrolls.push([target, offset]);
    }
  });
  return () => {
    for (const [node, offset] of scrolls) {
      // `scroll-behavior: smooth` would animate a `scrollTop` write.
      node.style.setProperty('scroll-behavior', 'auto');
      node.scrollLeft = offset.x;
      node.scrollTop = offset.y;
      node.style.removeProperty('scroll-behavior');
    }
  };
}

export interface DragPreviewSize {
  width: number;
  height: number;
}

/** The pickup state a preview resolves its offset from. */
export interface DragPreviewPickup {
  /** The source's bounding rect at pickup. */
  sourceRect: DOMRect;
  /** The source's size at pickup, without its own transform (see `measureSourceSize`). */
  sourceSize: DragPreviewSize;
  /** The input the drag started with. */
  input: DraggableInput;
  /**
   * The input at the press. The `'source'` offset uses it rather than `input`. Distance
   * activation commits on a later `pointermove`, so the preview would otherwise shift in
   * the gesture's direction.
   */
  pressInput: DraggableInput;
}

/**
 * Start a pickup's drag: build its preview, mark the source as dragged and publish the
 * `dragging` phase to its root. Call it once the source is measured, since
 * `[data-dragging]` rules can resize or hide it. The preview has no element until a
 * `Draggable.Positioner` attaches, and a drag without one shows no preview.
 */
export function createDragPreview(
  initialSourceElement: HTMLElement,
  initialIdentity: SyntheticPreviewSourceIdentity,
  pickup: DragPreviewPickup,
): DragPreview {
  // A preview still settling onto the source would clear its marks after this one sets them.
  finishEndingPreview(initialSourceElement);

  // Re-pointed when a virtualizer remounts the dragged item to a new node, so the
  // marks and the root's phase follow the live element.
  let sourceElement = initialSourceElement;
  let identity = initialIdentity;
  let phase: DragPhase = 'idle';
  let destroyed = false;
  let preparedForDrop = false;
  // Whether the release dropped on a target.
  let dropped = false;
  // Whether the drop transition started, after which the element can't be swapped.
  let endingStarted = false;
  // Stops the ending's frame and watchdog once settling started.
  let stopEnding: (() => void) | null = null;

  let current: PositionedPreview | null = null;
  // Assigned below, and read by the functions that end it.
  let preview: DragPreview;
  // Resolved when the first positioner attaches, from its settings.
  let modifiers: ReadonlyArray<DraggableRootModifier> | null = null;
  let offsetResolved = false;
  let previewOffset = ZERO_OFFSET;
  // The cursor from the latest `update`, or `null` before the first.
  let lastPoint: DraggablePosition | null = null;
  // The proposed top-left on the first frame, which preview axis locks and grids snap
  // against.
  let initialProposed: DraggablePosition | null = null;
  // The content's ancestor scale, read lazily for modifiers once it renders.
  let previewScale: DraggablePosition | null = null;
  // The modifier keys of the latest positioning event, stored because a late attach
  // positions the preview without an event.
  let lastKeys: DragModifierKeys = NO_MODIFIER_KEYS;

  function positionPreviewElement(): void {
    const cursor = lastPoint;
    if (!current || cursor === null) {
      return;
    }
    const target = current;
    target.ensureConnected();
    let proposedX = cursor.x - previewOffset.x;
    let proposedY = cursor.y - previewOffset.y;
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
          // A copy, so a modifier can't move the stored cursor.
          input: { ...cursor },
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
      // Consumer modifiers can end the drag or swap the preview.
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

  /** Clear the root's phase, unless a newer drag of the root replaced this one. */
  function release(owner: RootDragStore | undefined): void {
    if (owner?.state.preview === preview) {
      owner.setState(IDLE_ROOT_DRAG);
    }
  }

  function publish(): void {
    const owner = identity.owner;
    if (phase === 'idle') {
      release(owner);
    } else if (owner && (owner.state.phase !== phase || owner.state.preview !== preview)) {
      owner.setState({ phase, preview });
    }
  }

  /**
   * Mark the source and publish the phase to the root. Call it last in every transition,
   * since the root's render can unmount a positioner, whose detach must see the final
   * state or it leaves a stray copy (see `attach`).
   */
  function setPhase(next: DragPhase): void {
    phase = next;
    markSource(sourceElement, phase);
    publish();
  }

  const drag: LiveDrag = {
    get phase() {
      return phase;
    },
    get source() {
      return sourceElement;
    },
    get identity() {
      return identity;
    },
    retarget(element, nextIdentity) {
      if (phase === 'idle' || element === sourceElement) {
        return;
      }
      const previousElement = sourceElement;
      const previousOwner = identity.owner;
      markSource(previousElement, 'idle');
      if (phase === 'settling') {
        // A fresh drag from the destination can begin before this one settles.
        // It owns that source now, so finish the older preview first.
        findSettlingDrag(element)?.finish();
      }
      sourceElement = element;
      identity = nextIdentity;
      // Until the end sequence begins, the session's events follow the new node too.
      if (getActiveSession()?.preview === preview) {
        retargetDragSource(previousElement, element);
      }
      if (previousOwner !== identity.owner) {
        release(previousOwner);
      }
      // Marks the new node, and tells the root that renders it if the drag changed roots.
      setPhase(phase);
    },
    finish,
  };

  function finish(): void {
    if (phase === 'idle') {
      return;
    }
    stopEnding?.();
    liveDrags.delete(drag);
    current?.destroy();
    current = null;
    setPhase('idle');
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
    stopEnding = () => {
      frame.cancel();
      settlingWatchdog.clear();
    };

    // One preview settles onto a source at a time.
    findSettlingDrag(sourceElement)?.finish();
    setPhase('settling');

    // Start the ending in the next frame, before paint. The release is resolved by
    // then, so `[data-dropped]` lands with `[data-ending-style]`, and drop
    // handlers' state updates are committed, so the source is in its final slot.
    frame.request(() => {
      const target = current;
      if (!target) {
        finish();
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
      // without one runs where the preview was released. Also stay put when the source
      // is gone, or renders no box while the preview does, as under a
      // `[data-dragging] { display: none }` rule. It would measure as a zero rect at the
      // viewport corner.
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
        finish();
        return;
      }
      const longestAnimationMs = animations.reduce((longest, animation) => {
        const endTime = animation.effect?.getComputedTiming?.().endTime;
        return typeof endTime === 'number' && Number.isFinite(endTime)
          ? Math.max(longest, endTime)
          : longest;
      }, 0);
      // A paused animation's `finished` never settles.
      settlingWatchdog.start(
        clamp(
          longestAnimationMs + SETTLING_WATCHDOG_GRACE_MS,
          MIN_SETTLING_WATCHDOG_MS,
          MAX_SETTLING_WATCHDOG_MS,
        ),
        finish,
      );
      Promise.allSettled(animations.map((animation) => animation.finished)).then(finish);
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
    update(clientX: number, clientY: number, keys: DragModifierKeys = NO_MODIFIER_KEYS): void {
      if (destroyed) {
        return;
      }
      lastPoint = { x: clientX, y: clientY };
      lastKeys = keys;
      positionPreviewElement();
    },
    attach(element, content, settings) {
      if (phase === 'idle' || endingStarted) {
        // Too late to show it. Hidden until it detaches, so it doesn't show at the
        // viewport's corner.
        element.style.setProperty('visibility', 'hidden');
        return () => element.style.removeProperty('visibility');
      }
      // Created first, since it sets the size variables an offset function may read.
      const attached = createPositionedPreview(element, content ?? element, pickup.sourceSize);
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
      adopt(attached);
      return () => {
        if (current !== attached || phase === 'idle') {
          return;
        }
        // The root unmounted mid-drag, as when a virtualizer scrolls the source away or a
        // drop moves it to another list. Keep a copy in place until a remounted root
        // attaches again or the preview settles. React removes the original right after.
        attached.destroy();
        const parent = element.parentNode;
        if (!parent) {
          current = null;
          return;
        }
        const { copy, restoreState } = attached.freeze();
        parent.insertBefore(copy, element.nextSibling);
        restoreState();
        const copyContent =
          attached.content === element
            ? copy
            : (copy.querySelector<HTMLElement>(`[${DraggablePreviewDataAttributes.dragPreview}]`) ??
              copy);
        const frozen = createPositionedPreview(copy, copyContent, pickup.sourceSize, restoreState);
        if (attached.position) {
          // Rehoming repositions it from there, before the pointer moves again.
          frozen.setPosition(attached.position.x, attached.position.y);
        }
        current = frozen;
        // The copy's parent may be removed with the original, such as a portal's node.
        queueMicrotask(() => {
          if (current === frozen) {
            frozen.ensureConnected();
          }
        });
      };
    },
    setContent(element, content) {
      if (current?.element !== element || current.owned) {
        return;
      }
      current.setContent(content ?? element);
      previewScale = null;
      setAttributes(current);
      if (!endingStarted) {
        // Preview modifiers contain the new content's box.
        positionPreviewElement();
      }
    },
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
    end(drop: boolean): void {
      if (destroyed) {
        return;
      }
      if (drop) {
        preparedForDrop = true;
        // A preview without an element, because none is declared or it hasn't rendered,
        // has nothing to settle. It is destroyed at session end instead, so `[data-dragging]`
        // rules still apply while drop handlers measure against the layout under the pointer.
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
  liveDrags.add(drag);
  setPhase('dragging');
  return preview;
}

/** The drag preview, as the sensor, session and React layer use it. */
export interface DragPreview {
  /** `keys` are the modifier keys of the event behind this position, for preview modifiers. */
  update(clientX: number, clientY: number, keys?: DragModifierKeys): void;
  /**
   * Show `element`, a `Draggable.Positioner`, as the preview, and move it with the
   * pointer. `content` is the `Draggable.Preview` inside it, or `null` to position the
   * element itself. The first attach resolves the offset and modifiers from `settings`.
   * Returns the detach, which leaves a copy in place while the drag still needs one.
   * Once the ending started, `element` is hidden instead, until it detaches.
   */
  attach(
    element: HTMLElement,
    content: HTMLElement | null,
    settings: PreviewAttachSettings,
  ): () => void;
  /**
   * Position `content` inside an attached `element` from now on, as when the
   * `Draggable.Preview` renders a new element. Keeps the offset and modifiers.
   */
  setContent(element: HTMLElement, content: HTMLElement | null): void;
  getSourceElement(): HTMLElement;
  /** The element the engine moves, which hit-testing skips, or `null` without one. */
  getPreviewElement(): HTMLElement | null;
  /** The visible preview's rect, which rect modifiers contain, or `null` without one. */
  getPreviewRect(): DOMRect | null;
  /** The offset from the visible preview's top-left corner to the cursor. */
  getPreviewOffset(): DraggablePosition;
  /**
   * End the preview. On a drop it stays mounted while its ending transition settles
   * onto the source. Otherwise, such as on a cancel, it is removed at once.
   */
  end(drop: boolean): void;
  /** Mark the ending preview as dropped on a target, for `[data-dropped]` styles. */
  markDropped(): void;
}

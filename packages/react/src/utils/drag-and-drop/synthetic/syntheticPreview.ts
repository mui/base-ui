import { clamp } from '@base-ui/utils/clamp';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { contains } from '@base-ui/utils/shadowDom';
import { getFiniteAnimations } from '../../getFiniteAnimations';
import { WindowAnimationFrame } from '../../windowAnimationFrame';
import { WindowTimeout } from '../../windowTimeout';
import {
  createDragPreviewElement,
  measurePreviewAnchor,
  measurePreviewSource,
} from './cloneDragPreview';
import type { DragPreviewElementHandle, PreviewAnchor } from './cloneDragPreview';
import { copyPreviewContent, createPreviewContentContainer } from './previewContent';
import type { PreviewContent } from './previewContent';
import type { ResolvedDragPreview } from './pickupPreview';
import type { DraggableInput, DraggablePosition } from '../../../draggable/DraggableProvider';
import type {
  DraggablePreviewOffset,
  DraggablePreviewOffsetParameters,
} from '../../../draggable/preview/DraggablePreview';
import type { DraggableRootModifier } from '../../../draggable/root/DraggableRoot';
import type { DragModifierKeys } from '../utils';
import { applyDragModifiers, compileDragModifiers, ZERO_OFFSET } from '../dragModifiers';
import { getSharedSlot } from '../sharedState';
import { setSourceSettling } from '../settlingSources';
import { getActiveSession } from '../core/dragSession';
import { retargetDragSource } from '../dragSource';
import * as DraggablePreviewDataAttributes from '../../../draggable/preview/DraggablePreviewDataAttributes';
import * as DraggableRootDataAttributes from '../../../draggable/root/DraggableRootDataAttributes';
import { containConsumerError, getElementScale, NO_MODIFIER_KEYS } from '../utils';

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
 * Their state attributes affect measurement, and a child's preview would be
 * included in a parent clone.
 */
export function finishEndingPreview(source: Element): void {
  for (const entry of endingPreviews) {
    if (contains(source, entry.source)) {
      entry.finish();
    }
  }
}

/**
 * Finish every settling clone. Test-only, so a test that ends right after a drop
 * does not leave its clone in the document for the next one.
 */
export function finishAllEndingPreviewsForTests(): void {
  for (const entry of Array.from(endingPreviews)) {
    entry.finish();
  }
}

/**
 * Point the drag in progress, or a settling clone, at a draggable that just registered
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

/** How a custom preview's content is shown, set up at pickup by `attachDragPreview`. */
export interface PreviewContentOptions {
  /** Where the copy of the content goes. Measured at pickup. */
  anchor: PreviewAnchor;
  renderContent: NonNullable<ResolvedDragPreview['render']>;
  /**
   * Resolve the preview's offset from its first copy, once it has a size. Called again
   * only after the content declined the preview and rendered something new.
   */
  resolveOffset: (element: HTMLElement) => DraggablePosition;
}

export type AttachedPreviewContent = PreviewContentOptions & PreviewContent;

/**
 * Resolve a `DraggablePreviewOffset` into a pointer-relative offset. The default
 * `'source'` keeps the grab point, so a clone lifts off without shifting.
 */
function resolveDragPreviewOffset(
  offset: DraggablePreviewOffset | undefined,
  params: DraggablePreviewOffsetParameters,
): DraggablePosition {
  if (offset === 'pointer') {
    return { x: 0, y: 0 };
  }
  if (offset === undefined || offset === 'source') {
    return {
      x: params.input.clientX - params.sourceRect.left,
      y: params.input.clientY - params.sourceRect.top,
    };
  }
  if (typeof offset === 'function') {
    return offset(params);
  }
  return offset;
}

/**
 * Build the clone or custom-content copy that follows the pointer, unless the draggable
 * opted out. Both are measured before `data-dragging` lands on the source, so a
 * `[data-dragging]` rule dims the source alone. The default `'source'` offset uses
 * `pressInput`, not `input`: distance activation commits on a later `pointermove`, so
 * the preview would otherwise shift in the gesture's direction.
 */
function attachDragPreview(
  preview: SyntheticPreviewHandle,
  element: HTMLElement,
  settings: ResolvedDragPreview,
  input: DraggableInput,
  pressInput: DraggableInput,
): void {
  if (settings.disabled) {
    return;
  }
  const anchor = measurePreviewAnchor(element, settings.container);
  if (!anchor) {
    return;
  }

  const isSourceOffset = settings.offset === undefined || settings.offset === 'source';
  const resolveOffset = (container: HTMLElement) =>
    resolveDragPreviewOffset(settings.offset, {
      container,
      // The untransformed box the preview is anchored on (see
      // `measurePreviewSource`), so the clone lifts off where the source sits.
      sourceRect: anchor.sourceRect,
      input: isSourceOffset ? pressInput : input,
    });

  if (settings.render !== null) {
    preview.attachContent({
      anchor,
      renderContent: settings.render,
      // An offset callback needs the preview's rendered size, so every form resolves
      // once the first copy of the content is in place.
      resolveOffset(container) {
        if (typeof settings.offset !== 'function') {
          return resolveOffset(container);
        }
        // Consumer code. Uncontained, a throw would end the drag from inside the
        // React commit that rendered the content.
        return (
          containConsumerError(
            'Base UI: a drag preview "offset" function threw, so the preview uses the "source" offset.',
            container,
            () => resolveOffset(container),
            null,
          ) ??
          resolveDragPreviewOffset('source', { container, sourceRect: anchor.sourceRect, input })
        );
      },
    });
    return;
  }

  const previewElement = createDragPreviewElement(element, anchor);
  if (!previewElement) {
    return;
  }

  // Own the element before invoking consumer code so pickup cleanup can release it.
  preview.setPreviewElement(previewElement);
  preview.setPreviewOffset(resolveOffset(previewElement.element));
}

/**
 * Build a pickup's preview and mark the source as dragged. A disabled preview gets
 * no element. The preview is undone if consumer code it runs (an `offset` function)
 * throws. See `attachDragPreview` for `input` and `pressInput`.
 */
export function createDragPreview(
  source: HTMLElement,
  identity: SyntheticPreviewSourceIdentity,
  settings: ResolvedDragPreview,
  input: DraggableInput,
  pressInput: DraggableInput,
): DragPreview {
  const preview = createSyntheticPreview(
    source,
    identity,
    compileDragModifiers(settings.modifiers),
  );
  try {
    attachDragPreview(preview, source, settings, input, pressInput);
    // After the preview is built (see `markSourceDragging`).
    preview.markSourceDragging();
  } catch (error) {
    preview.end(false);
    throw error;
  }
  return preview;
}

/**
 * `modifiers` are the compiled preview-level modifiers, or `null` for none. They
 * constrain where the preview is drawn, not the drag itself.
 */
export function createSyntheticPreview(
  initialSourceElement: HTMLElement,
  sourceIdentity: SyntheticPreviewSourceIdentity,
  modifiers: ReadonlyArray<DraggableRootModifier> | null,
): SyntheticPreviewHandle {
  // Re-pointed when a virtualizer remounts the dragged item to a new node, so the
  // drag-state attribute follows the live element, as `Draggable.Root`'s `dragging` does.
  let sourceElement = initialSourceElement;
  let destroyed = false;
  let preparedForDrop = false;
  // Whether the release dropped on a target.
  let dropped = false;
  // Whether the released preview is still running its drop transition.
  let settling = false;

  // A clone of the source, or a copy of a custom preview's content.
  let previewElement: DragPreviewElementHandle | null = null;
  // The content of a custom preview and how it is shown. `null` for a clone.
  let content: AttachedPreviewContent | null = null;
  let previewOffsetX = 0;
  let previewOffsetY = 0;
  let lastX = 0;
  let lastY = 0;
  let hasPosition = false;
  // The proposed top-left on the first frame with the current offset, which preview
  // axis locks and grids snap against. Reset when the offset changes (a callback
  // offset resolving late).
  let initialProposed: DraggablePosition | null = null;
  // The preview's ancestor scale, cached since `getElementScale` walks to the root, and
  // read lazily for modifiers. It waits for a rendered preview (`getClientRects`), since
  // transforms resolve to matrices only on rendered elements and a torn-out or
  // `display: none` preview would cache `1`.
  let previewScale: DraggablePosition | null = null;
  // The modifier keys of the latest positioning event, stored because
  // `positionPreviewElement` also runs from `setPreviewOffset`, which has no event.
  let lastKeys: DragModifierKeys = NO_MODIFIER_KEYS;

  function positionPreviewElement(): void {
    if (!previewElement || !hasPosition) {
      return;
    }
    const currentPreview = previewElement;
    const element = currentPreview.element;
    // A virtualizer can recycle the preview's parent mid-drag.
    currentPreview.ensureConnected();
    let proposedX = lastX - previewOffsetX;
    let proposedY = lastY - previewOffsetY;
    initialProposed ??= { x: proposedX, y: proposedY };
    if (modifiers) {
      if (previewScale === null && element.getClientRects().length > 0) {
        previewScale = getElementScale(element);
      }
      const constrained = applyDragModifiers(
        modifiers,
        { x: proposedX, y: proposedY },
        {
          initialPoint: initialProposed,
          input: { x: lastX, y: lastY },
          sourceElement,
          sourceRect: currentPreview.anchor.sourceRect,
          // These modifiers move the preview, so a step in its own units uses the
          // preview's scale, not the source's.
          scale: previewScale ?? DEFAULT_SCALE,
          // `point` is the top-left itself here, so the offset is zero.
          previewOffset: ZERO_OFFSET,
          keys: lastKeys,
          ownerWindow: ownerWindow(element),
          getPreviewRect: () => element.getBoundingClientRect(),
        },
      );
      if (destroyed || previewElement !== currentPreview) {
        return;
      }
      proposedX = constrained.x;
      proposedY = constrained.y;
    }
    currentPreview.setPosition(proposedX, proposedY);
  }

  function setPreviewOffset(offset: DraggablePosition): void {
    previewOffsetX = offset.x;
    previewOffsetY = offset.y;
    initialProposed = null;
    if (!destroyed) {
      positionPreviewElement();
    }
  }

  function removePreviewElement(): void {
    previewElement?.destroy();
    previewElement = null;
    previewScale = null;
    // The offsets described the removed box. Left set, rect modifiers such as
    // `restrictToElement` would keep clamping against it.
    previewOffsetX = 0;
    previewOffsetY = 0;
  }

  function setPreviewElement(next: DragPreviewElementHandle): void {
    const previous = previewElement;
    previewElement = next;
    previewScale = null;
    positionPreviewElement();
    previous?.destroy();
  }

  /** Show a new copy of the custom content, or remove the preview when it is empty. */
  function showContent(root: HTMLElement | null): void {
    if (destroyed || !content) {
      return;
    }
    if (root === null) {
      removePreviewElement();
      return;
    }
    const next = createDragPreviewElement(sourceElement, content.anchor, root);
    if (!next) {
      return;
    }
    if (previewElement) {
      setPreviewElement(next);
      return;
    }
    previewElement = next;
    previewScale = null;
    // Consumer code. A cancel from it destroys this preview.
    const offset = content.resolveOffset(next.element);
    if (destroyed || previewElement !== next) {
      return;
    }
    setPreviewOffset(offset);
  }

  function retargetSource(element: HTMLElement): void {
    if ((destroyed && !settling) || element === sourceElement) {
      return;
    }

    sourceElement.removeAttribute(DraggableRootDataAttributes.dragging);
    setSourceSettling(sourceElement, false);
    if (settling) {
      // A fresh drag from the destination can begin before this one settles.
      // It owns that source now, so finish the older preview first.
      findEndingPreview(element)?.finish();
    }

    sourceElement = element;
    sourceElement.setAttribute(DraggableRootDataAttributes.dragging, '');
    if (settling) {
      setSourceSettling(sourceElement, true);
    }
  }

  function destroy(): void {
    if (destroyed) {
      return;
    }
    destroyed = true;
    const endingPreview = previewElement;
    previewElement = null;

    // The engine owns the preview element in both modes, so it can stay mounted
    // until the consumer's drop transition finishes.
    if (preparedForDrop && endingPreview) {
      const element = endingPreview.element;
      const frame = new WindowAnimationFrame(ownerWindow(element));
      const settlingWatchdog = new WindowTimeout(ownerWindow(element));
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
          endingPreview.destroy();
          sourceElement.removeAttribute(DraggableRootDataAttributes.dragging);
          setSourceSettling(sourceElement, false);
          settling = false;
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
        endingPreview.ensureConnected();
        // Commit the position the drag left the preview at, so an ending transition
        // animates only what changes from here.
        const style = ownerWindow(element).getComputedStyle(element);
        void style.translate;
        element.setAttribute(DraggablePreviewDataAttributes.endingStyle, '');
        if (dropped) {
          element.setAttribute(DraggablePreviewDataAttributes.dropped, '');
        }
        endingPreview.prepareForDrop();
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
          const { sourceRect: destination } = measurePreviewSource(sourceElement);
          endingPreview.setPosition(destination.left, destination.top);
        }

        const animations =
          globalThis.BASE_UI_ANIMATIONS_DISABLED || !element.getAnimations
            ? []
            : getFiniteAnimations(element);
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
      return;
    }

    endingPreview?.destroy();
    sourceElement.removeAttribute(DraggableRootDataAttributes.dragging);
  }

  return {
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
    setPreviewElement,
    attachContent(options: PreviewContentOptions): void {
      const parent = options.anchor.hosts[0];
      content = {
        ...options,
        container: createPreviewContentContainer(ownerDocument(sourceElement), parent),
        parent,
        copy: null,
      };
    },
    getContent(): AttachedPreviewContent | null {
      return content;
    },
    syncContent(): void {
      if (destroyed || !content) {
        return;
      }
      if (content.update) {
        content.update();
      } else if (!content.copy) {
        // The content is copied once. Later renders reach the preview only through
        // `Draggable.updatePreview()`.
        content.copy = copyPreviewContent(content);
        showContent(content.copy.root);
      }
    },
    markSourceDragging(): void {
      finishEndingPreview(sourceElement);
      sourceElement.setAttribute(DraggableRootDataAttributes.dragging, '');
    },
    identity: sourceIdentity,
    showContent,
    retargetSource,
    setPreviewOffset,
    getPreviewElement(): DragPreviewElementHandle | null {
      return previewElement;
    },
    getPreviewOffset(): DraggablePosition {
      return { x: previewOffsetX, y: previewOffsetY };
    },
    end(drop: boolean): void {
      if (destroyed) {
        return;
      }
      if (drop) {
        preparedForDrop = true;
        // A preview without an element (custom content that never rendered) has
        // nothing to settle. It is destroyed at session end instead, so
        // `[data-dragging]` rules still apply while drop handlers measure against
        // the layout under the pointer.
        const session = getActiveSession();
        if (previewElement === null && session !== null) {
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
}

/** The built drag preview, as the sensor, session and React layer use it. */
export interface DragPreview {
  /** The source it was picked up from (see `retargetPreviewSource`). */
  readonly identity: SyntheticPreviewSourceIdentity;
  /** `keys` are the modifier keys of the event behind this position, for preview modifiers. */
  update(clientX: number, clientY: number, keys?: DragModifierKeys): void;
  /** Follow the drag source to a fresh node when a virtualizer remounts it mid-drag. */
  retargetSource(element: HTMLElement): void;
  getPreviewElement(): DragPreviewElementHandle | null;
  /**
   * Adopt a preview, positioned before the previous one is destroyed.
   * `Draggable.updatePreview()` replaces a clone through it.
   */
  setPreviewElement(preview: DragPreviewElementHandle): void;
  /**
   * Show a new copy of the custom content, or remove the preview when `root` is
   * `null`. `Draggable.updatePreview()` shows an updated copy through it.
   */
  showContent(root: HTMLElement | null): void;
  /** The offset from the preview's top-left to the cursor. */
  getPreviewOffset(): DraggablePosition;
  /**
   * The custom preview's content, or `null` for a clone. The React layer renders it
   * into `container`, and the copy is built once it has.
   */
  getContent(): AttachedPreviewContent | null;
  /** Copy the content after its first commit, or run its pending update. */
  syncContent(): void;
  /**
   * End the preview. On a drop it stays mounted while its ending transition settles
   * onto the source. Otherwise, such as on a cancel, it is removed at once.
   */
  end(drop: boolean): void;
  /** Mark the ending preview as dropped on a target, for `[data-dropped]` styles. */
  markDropped(): void;
}

/**
 * The steps `createDragPreview` builds a preview with. They are this module's
 * internal seam, which its tests drive with a stand-in element.
 */
export interface SyntheticPreviewHandle extends DragPreview {
  /**
   * Show a custom preview's content. Until its first copy, the drag has no preview
   * element.
   */
  attachContent(options: PreviewContentOptions): void;
  /**
   * Set the offset from the preview's top-left to the cursor. Called at pickup, or
   * once the first copy of custom content has a size.
   */
  setPreviewOffset(offset: DraggablePosition): void;
  /**
   * Mark the source as being dragged. Called once the preview exists, so a
   * `[data-dragging]` rule that resizes or hides the source can't corrupt the
   * measurement the preview was built from.
   */
  markSourceDragging(): void;
}

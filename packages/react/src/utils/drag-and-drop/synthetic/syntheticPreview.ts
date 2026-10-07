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
import { updatePreviewContent } from './updatePreviewContent';
import type { ResolvedDragPreview } from './pickupPreview';
import type { DraggableInput, DraggablePosition } from '../../../draggable/DraggableProvider';
import type {
  DraggablePreviewOffset,
  DraggablePreviewOffsetParameters,
  DraggablePreviewRenderParameters,
} from '../../../draggable/preview/DraggablePreview';
import type { DraggableRootModifier } from '../../../draggable/root/DraggableRoot';
import type { DragModifierKeys } from '../utils';
import { applyDragModifiers, compileDragModifiers, ZERO_OFFSET } from '../dragModifiers';
import { getSharedSlot } from '../sharedState';
import { setSourceSettling } from '../settlingSources';
import { getActiveSession } from '../core/dragSession';
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
}

/**
 * The identity of a draggable's source, from its parameters. Registration and pickup
 * build it the same way, so a remounted source finds the preview it left behind.
 */
export function getPreviewSourceIdentity(parameters: {
  kind: { id: symbol };
  previewKey?: string | number | undefined;
  payload?: unknown;
}): SyntheticPreviewSourceIdentity {
  return {
    kind: parameters.kind.id,
    previewKey: parameters.previewKey,
    payload: parameters.payload,
  };
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
 * Point a settling clone at a draggable that remounted in the drop commit.
 * A cross-container move creates a new React subtree, so the active-drag retargeting
 * path cannot link the old and new ref callbacks.
 */
export function retargetEndingPreviewSource(
  element: HTMLElement,
  identity: SyntheticPreviewSourceIdentity,
): void {
  for (const entry of endingPreviews) {
    if (entry.source.isConnected || entry.identity.kind !== identity.kind) {
      continue;
    }

    const sameDeclaredPayload =
      identity.payload !== undefined && Object.is(entry.identity.payload, identity.payload);
    const samePreviewKey =
      identity.previewKey !== undefined &&
      Object.is(entry.identity.previewKey, identity.previewKey);
    if (sameDeclaredPayload || samePreviewKey) {
      entry.retarget(element);
      return;
    }
  }
}

/** How a custom preview's content is shown, set up at pickup by `attachDragPreview`. */
export interface PreviewContentOptions {
  /** Where the copy of the content goes. Measured at pickup. */
  anchor: PreviewAnchor;
  /** The consumer's function that renders the content. */
  renderContent: NonNullable<ResolvedDragPreview['render']>;
  /**
   * Resolve the preview's offset from its first copy, once it has a size. Called again
   * only after the content declined the preview and rendered something new.
   */
  resolveOffset: (element: HTMLElement) => DraggablePosition;
}

export type AttachedPreviewContent = PreviewContentOptions & PreviewContent;

/**
 * Resolve a `DraggablePreviewOffset` (the `'source'`/`'pointer'` presets, a fixed
 * `DraggablePosition`, or a callback) into a concrete pointer-relative offset.
 *
 * Defaults to `'source'`, which keeps the grab point the preview was picked up by,
 * so a cloned preview lifts off the element without shifting.
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
 * Build the element that follows the pointer, unless the draggable opted out.
 *
 * Without custom content, the source is cloned into a sanitized preview that keeps
 * its classes and live state. With custom content, the React layer renders it into
 * a detached element, and the preview is a copy of it, built once it has rendered.
 * Both are measured now, before `data-dragging` lands on the source, so the clone
 * never inherits it and the usual `[data-dragging] { opacity: .4 }` rule dims the
 * source alone.
 *
 * `pressInput` is the original press, and `input` is the pointer state the pickup
 * committed on. Distance activation commits on a later `pointermove`, so the
 * default `'source'` offset is measured from the press. Otherwise crossing the
 * threshold would shift the preview in the gesture's direction.
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
      // The rect the preview occupies. For a transformed source, this is the
      // untransformed box the clone is anchored on (see `measurePreviewSource`), not
      // the transformed one from `getBoundingClientRect`, so the clone lifts off
      // where the source sits.
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
 * Build the preview of a pickup from its resolved settings, and mark the source as
 * being dragged. A disabled preview gets no element. The preview is undone when
 * consumer code it runs, such as an `offset` function, throws.
 *
 * `pressInput` is the original press, and `input` is the pointer state the pickup
 * committed on (see `attachDragPreview`).
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
    // Only after the preview is built. A `[data-dragging]` rule that resizes or
    // hides the source would otherwise corrupt the measurement it was built from.
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

  // The element that follows the pointer: a clone of the source, or a copy of a
  // custom preview's content. It lives beside the source or in the configured
  // `container`. The sensor moves it through `update`.
  let previewElement: DragPreviewElementHandle | null = null;
  // The content of a custom preview and how it is shown. `null` for a clone.
  let content: AttachedPreviewContent | null = null;
  let previewOffsetX = 0;
  let previewOffsetY = 0;
  let lastX = 0;
  let lastY = 0;
  let hasPosition = false;
  // The preview's proposed top-left on the first frame positioned with the
  // current offset. Preview-level axis locks and grids snap against it. Reset
  // whenever the offset changes (a callback offset resolving late), so the anchor
  // never comes from a stale offset.
  let initialProposed: DraggablePosition | null = null;
  // The ancestor scale applied to the preview. `getElementScale` walks to the root
  // reading computed styles, so it is measured once instead of on every frame. It
  // only changes if an ancestor transform changes, which does not happen mid-drag.
  //
  // Only the modifiers use it, so it is read lazily in that branch. It does need a
  // rendered element. Browsers resolve computed transforms to matrices only for
  // rendered elements, so a preview a re-render tore out (see `ensureConnected`),
  // or one under `display: none`, would cache `1` for the rest of the drag.
  // `getClientRects` checks this without requiring a size.
  let previewScale: DraggablePosition | null = null;
  // The modifier keys of the event behind the latest position, so preview modifiers
  // see the same key state as root modifiers. Stored here because
  // `positionPreviewElement` also runs from `setPreviewOffset`, which has no event.
  let lastKeys: DragModifierKeys = NO_MODIFIER_KEYS;

  function positionPreviewElement(): void {
    if (!previewElement || !hasPosition) {
      return;
    }
    const currentPreview = previewElement;
    const element = currentPreview.element;
    // A virtualizer can recycle the source's row (and its parent) mid-drag,
    // taking the preview's parent with it. Re-home it before writing the position.
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
    // The offsets described the removed box. Left set, rect modifiers
    // (`restrictToElement`, `restrictToWindowEdges`) would keep clamping against
    // it, for example after a `Draggable.Preview` renders `null`.
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

  /**
   * Clone the source again. The clone is built while the source is marked as
   * dragged, so its drag-state attributes are lifted for the duration. Otherwise a
   * `[data-dragging]` rule, such as a dimmed source, would be copied into the
   * clone's style snapshot. Nothing renders in between.
   */
  function refreshClone(): void {
    const current = previewElement;
    if (!current || !sourceElement.isConnected) {
      return;
    }
    const source = sourceElement;
    const dragState = [DraggableRootDataAttributes.dragging, DraggableRootDataAttributes.settling]
      .map((name) => [name, source.getAttribute(name)] as const)
      .filter(([, value]) => value !== null);
    for (const [name] of dragState) {
      source.removeAttribute(name);
    }
    let next;
    try {
      next = createDragPreviewElement(source, current.anchor);
    } finally {
      for (const [name, value] of dragState) {
        source.setAttribute(name, value!);
      }
    }
    if (next && previewElement === current) {
      setPreviewElement(next);
    } else {
      next?.destroy();
    }
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

      // The ending starts in the next frame, before it paints. The release is
      // resolved by then, so `[data-dropped]` applies along with
      // `[data-ending-style]` and no style is computed with one but not the other.
      // State updates that drop handlers schedule later in the release event are
      // committed too, so measuring targets the source's final slot.
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
        // Only a `translate` transition animates the move to the source's final
        // position. Without one, the preview ends where it was released, so an
        // ending fade runs there instead of at the source. It ends in place too when
        // the source is gone, or renders no box while the preview does, such as one
        // a `[data-dragging] { display: none }` rule hides: it then measures as a
        // zero rect at the viewport corner.
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
      // Set only after the preview is built. A `[data-dragging]` rule that changes
      // the source's geometry or hides it would otherwise corrupt the measurement
      // the clone is sized from.
      sourceElement.setAttribute(DraggableRootDataAttributes.dragging, '');
    },
    refresh(parameters: DraggablePreviewRenderParameters): void {
      if (destroyed) {
        return;
      }
      const attached = content;
      if (!attached) {
        refreshClone();
        return;
      }
      // Runs after the content's next commit (see `syncContent`).
      attached.update = () => {
        attached.update = undefined;
        updatePreviewContent(attached, {
          onRoot: showContent,
          onRootChange(ownStyle) {
            previewElement?.updateContentStyle(ownStyle);
          },
        });
      };
      attached.render?.(parameters);
    },
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
        // A preview without an element, such as custom content that never
        // rendered, has nothing to settle. Its `[data-dragging]` goes when it is
        // destroyed, so that waits for the end of the session. A rule that resizes
        // or hides the source then still applies while drop handlers measure local
        // points against the layout under the pointer.
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

/**
 * The drag preview, as the sensor, the session and the React layer use it once
 * `createDragPreview` has built it.
 */
export interface DragPreview {
  /** `keys` are the modifier keys of the event behind this position, for preview modifiers. */
  update(clientX: number, clientY: number, keys?: DragModifierKeys): void;
  /**
   * Build the preview again for `Draggable.updatePreview()`. A clone of the source is
   * cloned again. Custom content renders again with `parameters`, and the copy takes
   * what changed after its next commit.
   */
  refresh(parameters: DraggablePreviewRenderParameters): void;
  /** Follow the drag source to a fresh node when a virtualizer remounts it mid-drag. */
  retargetSource(element: HTMLElement): void;
  /** The current preview element, or `null`. */
  getPreviewElement(): DragPreviewElementHandle | null;
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
   * Adopt a preview, positioning it before destroying the previous element.
   * The engine writes only its `translate`.
   */
  setPreviewElement(preview: DragPreviewElementHandle): void;
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
   * `[data-dragging]` rule can't affect the geometry the preview was measured from.
   */
  markSourceDragging(): void;
}

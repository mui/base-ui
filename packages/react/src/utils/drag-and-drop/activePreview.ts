import { getSharedSlot } from './sharedState';
import type { SyntheticPreviewHandle } from './synthetic/syntheticPreview';
import type { DragPreviewElementHandle } from './synthetic/cloneDragPreview';
import type { ResolvedDragPreview } from './synthetic/dragPreviewSettings';
import type { DragPosition } from '../../types/drag';

/**
 * The active drag's preview handle, so the React layer can reach the element the
 * engine built for it — regardless of input mode — along with the settings the
 * sensor resolved it from, so React never resolves them a second time.
 */
interface ActivePreviewSlot {
  handle: SyntheticPreviewHandle | null;
  settings: ResolvedDragPreview<any> | null;
}

const slot = getSharedSlot<ActivePreviewSlot>('activeDragPreview', () => ({
  handle: null,
  settings: null,
}));

/**
 * Sensor-only: publish the active drag's preview handle and the settings behind it.
 * Returns a restore function for pickups that publish before the lifecycle accepts
 * the session: when it refuses (a drag is already running), the previous drag's
 * handle must come back instead of being cleared, or its retarget/offset paths
 * would silently no-op for the rest of that drag.
 */
export function setActivePreviewHandle(
  handle: SyntheticPreviewHandle,
  settings: ResolvedDragPreview<any>,
): () => void {
  const previousHandle = slot.handle;
  const previousSettings = slot.settings;
  slot.handle = handle;
  slot.settings = settings;
  return () => {
    if (slot.handle === handle) {
      slot.handle = previousHandle;
      slot.settings = previousSettings;
    }
  };
}

/**
 * Sensor-only: release `handle`, but only if it is still the published one, so a
 * sensor tearing down its own pickup can't clear a slot another one has since
 * taken over.
 */
export function clearActivePreviewHandle(handle: SyntheticPreviewHandle): void {
  if (slot.handle === handle) {
    slot.handle = null;
    slot.settings = null;
  }
}

/**
 * The settings the active drag's preview was built from. The React layer reads them
 * to decide whether it has any content to render at all.
 */
export function getActiveDragPreviewSettings(): ResolvedDragPreview<any> | null {
  return slot.settings;
}

/**
 * Follow the drag source to a fresh node when a virtualizer remounts it mid-drag,
 * so `data-dragging` keeps tracking the live element the way `isDragging` does.
 */
export function retargetActivePreviewSource(element: HTMLElement): void {
  slot.handle?.retargetSource(element);
}

/**
 * The host a declared preview renders its content into: an empty element the engine
 * injected next to the source (or into the configured container) and positions each
 * frame. `null` when the active drag has no custom preview — the default clone needs
 * no React involvement at all.
 */
export function getActivePreview(): DragPreviewElementHandle | null {
  const preview = slot.handle?.getPreviewElement() ?? null;
  return preview?.isHost ? preview : null;
}

/**
 * Re-anchor the active preview once React has rendered into the host and it has a
 * size. Only an offset *callback* needs this — every other form is resolved from
 * the source rect alone, before React runs. A no-op when no drag is active.
 */
export function setActivePreviewOffset(offset: DragPosition): void {
  slot.handle?.setPreviewOffset(offset);
}

/**
 * Tear down the preview the sensor built for this drag. Used when a `Draggable.Preview`
 * resolves its content to `null`: the host is already in the DOM, and an empty box
 * would otherwise follow the pointer.
 */
export function removeActivePreview(): void {
  slot.handle?.removePreviewElement();
}

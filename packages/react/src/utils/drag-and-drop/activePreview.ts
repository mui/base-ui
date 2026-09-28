import { getSharedSlot } from './sharedState';
import type { SyntheticPreviewHandle } from './synthetic/syntheticPreview';
import type { ResolvedDragPreview } from './synthetic/dragPreviewSettings';

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
 * The active drag's preview handle. The React layer reads the host from it, re-anchors
 * the host once its content has rendered, and tears it down when the content resolves
 * to nothing. The session store retargets it when a virtualizer remounts the source
 * mid-drag, so `data-dragging` follows the live element. `null` when no drag is active.
 */
export function getActivePreviewHandle(): SyntheticPreviewHandle | null {
  return slot.handle;
}

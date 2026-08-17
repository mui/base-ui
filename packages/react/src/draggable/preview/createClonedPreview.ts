import type { DragPreviewParameters, DragPreviewSettings } from '../../types/drag';
import { createClonedDragPreviewElement } from '../../utils/drag-and-drop/synthetic/cloneDragPreview';
import { dragPreviewElementFactory } from '../../utils/drag-and-drop/synthetic/previewElementFactory';
import type { DragPreviewParametersWithFactory } from '../../utils/drag-and-drop/synthetic/previewElementFactory';

/**
 * Creates the full-fidelity cloned preview configuration for a source registered
 * with `useDragDropManager`.
 */
export function createClonedPreview(settings: DragPreviewSettings = {}): DragPreviewParameters {
  const parameters: DragPreviewParametersWithFactory = {
    ...settings,
    [dragPreviewElementFactory]: createClonedDragPreviewElement,
  };
  return parameters;
}

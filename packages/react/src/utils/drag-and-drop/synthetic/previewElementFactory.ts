import type { DragPreviewParameters } from '../../../types/drag';
import type { DragPreviewElementFactory } from './cloneDragPreview';

export const dragPreviewElementFactory = Symbol('dragPreviewElementFactory');

export type DragPreviewParametersWithFactory<TData = unknown> = DragPreviewParameters<TData> & {
  [dragPreviewElementFactory]?: DragPreviewElementFactory | undefined;
};

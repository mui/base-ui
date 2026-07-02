import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { DropzoneRootState } from './DropzoneRoot';
import { DropzoneRootDataAttributes } from './DropzoneRootDataAttributes';

export const dropzoneRootStateAttributesMapping: StateAttributesMapping<DropzoneRootState> = {
  dragging(value: boolean): Record<string, string> | null {
    return value ? { [DropzoneRootDataAttributes.dragging]: '' } : null;
  },
  disabled(value: boolean): Record<string, string> | null {
    return value ? { [DropzoneRootDataAttributes.disabled]: '' } : null;
  },
};

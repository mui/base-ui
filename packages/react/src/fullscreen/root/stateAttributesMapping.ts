import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { FullscreenContainerDataAttributes } from '../container/FullscreenContainerDataAttributes';
import type { FullscreenRootState } from './FullscreenRoot';

const FULLSCREEN_HOOK = {
  [FullscreenContainerDataAttributes.fullscreen]: '',
};

const NOT_FULLSCREEN_HOOK = {
  [FullscreenContainerDataAttributes.notFullscreen]: '',
};

/**
 * Shared state attribute mapping for parts that reflect the fullscreen state
 * via `data-fullscreen` / `data-not-fullscreen` (Container, Trigger, Close).
 */
export const fullscreenStateMapping = {
  open(value) {
    return value ? FULLSCREEN_HOOK : NOT_FULLSCREEN_HOOK;
  },
} satisfies StateAttributesMapping<FullscreenRootState>;

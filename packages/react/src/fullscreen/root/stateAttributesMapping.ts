import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { FullscreenContainerDataAttributes } from '../container/FullscreenContainerDataAttributes';
import { FullscreenTriggerDataAttributes } from '../trigger/FullscreenTriggerDataAttributes';
import type { FullscreenRootState } from './FullscreenRoot';

const FULLSCREEN_HOOK = {
  [FullscreenContainerDataAttributes.fullscreen]: '',
};

const NOT_FULLSCREEN_HOOK = {
  [FullscreenContainerDataAttributes.notFullscreen]: '',
};

/**
 * State attribute mapping for elements that visually reflect the fullscreen state
 * with both `data-fullscreen` and `data-not-fullscreen` (the container).
 */
export const fullscreenContainerStateMapping = {
  open(value) {
    return value ? FULLSCREEN_HOOK : NOT_FULLSCREEN_HOOK;
  },
} satisfies StateAttributesMapping<FullscreenRootState>;

/**
 * State attribute mapping for the trigger. Only sets `data-fullscreen` while
 * fullscreen is active so authors can target the pressed state without managing
 * a second attribute.
 */
export const fullscreenTriggerStateMapping = {
  open(value) {
    if (value) {
      return {
        [FullscreenTriggerDataAttributes.fullscreen]: '',
      };
    }
    return null;
  },
} satisfies StateAttributesMapping<FullscreenRootState>;

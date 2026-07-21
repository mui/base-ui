import type { StateAttributesMapping } from '../internals/getStateAttributesProps';
import {
  TransitionStatusDataAttributes,
  transitionStatusMapping,
} from '../internals/stateAttributesMapping';
import type { TransitionStatus } from '../internals/useTransitionStatus';

export enum CommonPopupDataAttributes {
  /**
   * Present when the popup is open.
   */
  open = 'data-open',
  /**
   * Present when the popup is closed.
   */
  closed = 'data-closed',
  /**
   * Present when the popup begins animating in.
   */
  startingStyle = TransitionStatusDataAttributes.startingStyle,
  /**
   * Present when the popup is animating out.
   */
  endingStyle = TransitionStatusDataAttributes.endingStyle,
  /**
   * Present when the anchor is hidden.
   */
  anchorHidden = 'data-anchor-hidden',
  /**
   * Indicates which side the popup is positioned relative to the trigger.
   * @type { 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
   */
  side = 'data-side',
  /**
   * Indicates how the popup is aligned relative to specified side.
   * @type {'start' | 'center' | 'end'}
   */
  align = 'data-align',
}

export enum CommonTriggerDataAttributes {
  /**
   * Present when the popup is open.
   */
  popupOpen = 'data-popup-open',
  /**
   * Present when a pressable trigger is pressed.
   */
  pressed = 'data-pressed',
}

// Literal keys (instead of enum member references) keep the docs-only enums above
// tree-shakeable: a runtime reference would retain the whole enum IIFE in every bundle.
const TRIGGER_HOOK = {
  'data-popup-open': '',
};

const PRESSABLE_TRIGGER_HOOK = {
  'data-popup-open': '',
  'data-pressed': '',
};

const POPUP_OPEN_HOOK = {
  'data-open': '',
};

const POPUP_CLOSED_HOOK = {
  'data-closed': '',
};

const ANCHOR_HIDDEN_HOOK = {
  'data-anchor-hidden': '',
};

export const triggerOpenStateMapping = {
  open(value) {
    if (value) {
      return TRIGGER_HOOK;
    }
    return null;
  },
} satisfies StateAttributesMapping<{ open: boolean }>;

export const pressableTriggerOpenStateMapping = {
  open(value) {
    if (value) {
      return PRESSABLE_TRIGGER_HOOK;
    }
    return null;
  },
} satisfies StateAttributesMapping<{ open: boolean }>;

export const popupStateMapping = {
  open(value) {
    if (value) {
      return POPUP_OPEN_HOOK;
    }
    return POPUP_CLOSED_HOOK;
  },
  anchorHidden(value) {
    if (value) {
      return ANCHOR_HIDDEN_HOOK;
    }
    return null;
  },
} satisfies StateAttributesMapping<{ open: boolean; anchorHidden: boolean }>;

export const popupTransitionStateMapping = {
  ...popupStateMapping,
  ...transitionStatusMapping,
} satisfies StateAttributesMapping<{
  open: boolean;
  anchorHidden: boolean;
  transitionStatus: TransitionStatus;
}>;

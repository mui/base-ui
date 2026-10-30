export const FOCUSABLE_ATTRIBUTE = 'data-base-ui-focusable';
export const ACTIVE_KEY = 'active';
export const SELECTED_KEY = 'selected';
export const TYPEABLE_SELECTOR =
  "input:not([type='hidden']):not([disabled])," +
  "[contenteditable]:not([contenteditable='false']),textarea:not([disabled])";
export const ARROW_LEFT = 'ArrowLeft';
export const ARROW_RIGHT = 'ArrowRight';
export const ARROW_UP = 'ArrowUp';
export const ARROW_DOWN = 'ArrowDown';
export const PAGE_UP = 'PageUp';
export const PAGE_DOWN = 'PageDown';

/**
 * Items a page key moves the highlight by. A fixed count rather than a measured viewport: it is
 * the same in a windowed list, where most items have no height yet, as in a plain one.
 */
export const LIST_PAGE_SIZE = 10;

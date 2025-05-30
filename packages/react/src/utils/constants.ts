export const TYPEAHEAD_RESET_MS = 500;
export const PATIENT_CLICK_THRESHOLD = 500;

/**
 * Used for dropdowns that usually strictly prefer top/bottom placements and
 * use `var(--available-height)` to limit their height.
 */
export const DROPDOWN_COLLISION_AVOIDANCE = {
  fallbackAxisSide: 'none',
} as const;

/**
 * Used by regular popups that usually aren't scrollable and are allowed to
 * freely flip to any axis of placement.
 */
export const POPUP_COLLISION_AVOIDANCE = {
  fallbackAxisSide: 'end',
} as const;

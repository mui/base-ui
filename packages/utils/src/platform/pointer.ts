import { hasWindow, matchMedia } from './shared';

// `(hover: none)` reflects the *primary* input modality — true on touch-only
// devices, false on desktops and hybrid laptops where a mouse is the primary
// pointer (even if the screen also accepts touch).
/**
 * Device has hover capability — true on desktops and hybrid laptops with a
 * mouse, false on touch-only devices like phones. Derived from `(hover: none)`.
 * Use this for *modality* decisions (e.g. hover vs. tap UX). Defaults to `true`
 * in SSR (assume desktop).
 */
export const hover = !matchMedia('(hover: none)');

// Capability check: does the runtime expose the `Touch` constructor? True on
// any device able to dispatch touch events, including hybrid laptops with both
// a mouse and a touchscreen.
// Independent of `hover`.
/**
 * Device can dispatch touch events (the `Touch` constructor exists). True on
 * hybrid laptops with a touchscreen even when the primary input is a mouse.
 * Use this for *capability* decisions (e.g. binding touch handlers); use
 * `hover` to choose between hover vs. tap UX.
 */
/* eslint-disable-next-line compat/compat */
export const touch = hasWindow && typeof window.Touch !== 'undefined';

/** A coarse pointer is available (e.g. touchscreen on a hybrid laptop). */
export const coarse = matchMedia('(pointer: coarse)');

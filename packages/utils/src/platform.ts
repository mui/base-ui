interface NavigatorUAData {
  readonly brands: ReadonlyArray<{ brand: string; version: string }>;
  readonly mobile: boolean;
  readonly platform: string;
}

interface RawNavigatorData {
  readonly userAgent: string;
  readonly platform: string;
  readonly maxTouchPoints: number;
}

const data = readRawData();
const lowerPlatform = data.platform.toLowerCase();
const hasWindow = typeof window !== 'undefined';

// --- Operating system --------------------------------------------------------

// iPadOS 13+ reports `MacIntel` for `navigator.platform`; disambiguated via
// `maxTouchPoints` so iPad is classified as iOS, not macOS.
const ios =
  lowerPlatform === 'ios' ||
  /iP(hone|ad|od)/.test(data.platform) ||
  (data.platform === 'MacIntel' && data.maxTouchPoints > 1);
const android = lowerPlatform === 'android' || /android/i.test(data.userAgent);
const mac = !ios && lowerPlatform.startsWith('mac');
const windows = lowerPlatform === 'windows' || /^win/i.test(data.platform);
const linux =
  !android &&
  (lowerPlatform === 'linux' ||
    lowerPlatform.startsWith('chrome os') ||
    /linux/i.test(data.platform));

// --- Rendering engine --------------------------------------------------------

// WebKit (Safari, all iOS browsers, GNOME Web). Distinguished from Blink by
// the legacy `-webkit-backdrop-filter` name — Blink forked from WebKit in 2013
// and only ships the unprefixed `backdrop-filter`.
const webkit = typeof CSS !== 'undefined' && !!CSS.supports?.('-webkit-backdrop-filter:none');
// Anchored to `!webkit` so engines are mutually exclusive by construction.
// Firefox-on-iOS uses WebKit (its UA marker is `FxiOS/`, not `Firefox/`); the
// `!webkit` prefix also defends against future iOS-browser UA changes that
// might inject `Firefox` into a WebKit-based UA.
const gecko = !webkit && /firefox/i.test(data.userAgent);
// All Chromium-based browsers ship `Chrome/` in their UA (Chrome, Edge, Opera,
// Brave) or include `Chromium` in `userAgentData.brands` (which `readRawData`
// synthesizes into the UA string). Chrome-on-iOS uses `CriOS/` and stays
// WebKit. The positive UA check also makes this SSR-safe — an empty UA matches
// nothing.
const blink = !webkit && /chrome|chromium/i.test(data.userAgent);

// --- Pointer -----------------------------------------------------------------

// `(hover: none)` reflects the *primary* input modality — true on touch-only
// devices, false on desktops and hybrid laptops where a mouse is the primary
// pointer (even if the screen also accepts touch).
const noHover = matchMedia('(hover: none)');
const coarsePointer = matchMedia('(pointer: coarse)');
// Capability check: does the runtime expose the `Touch` constructor? True on
// any device able to dispatch touch events, including hybrid laptops with both
// a mouse and a touchscreen.
// Independent of `noHover`.
/* eslint-disable-next-line compat/compat */
const touchCapable = hasWindow && typeof window.Touch !== 'undefined';

// --- Screen reader -----------------------------------------------------------

// Whether a screen reader is *actually* running cannot be detected. These
// flags identify platforms where a specific screen reader's accessibility
// quirks would apply if it were active.
//
// VoiceOver moves browser focus as its virtual cursor moves and only triggers
// `onFocus` on focusable/role-button elements via WebKit's NSAccessibility
// path. That path only exists on Apple platforms running WebKit — Chrome on
// macOS uses Blink and has a different AX integration.
const voiceOver = (mac || ios) && webkit;

// --- Environment -------------------------------------------------------------

const jsdom = /jsdom|HappyDOM/i.test(data.userAgent);

/**
 * Platform-detection flags. SSR-safe — every flag is `false` when `navigator`
 * is undefined, except `pointer.hover`, which defaults to `true` (assume
 * desktop).
 *
 * Import as a namespace and pick the most precise group for the quirk:
 *
 * ```ts
 * import * as platform from '@base-ui/utils/platform';
 * if (platform.os.mac) { ... }
 * if (platform.engine.webkit) { ... }
 * ```
 *
 *   - `os.*` for OS-specific behavior (keyboard shortcuts, native menus).
 *   - `engine.*` for rendering-engine bugs (CSS, layout, focus).
 *   - `pointer.*` for input-modality assumptions.
 *   - `screenReader.*` for AT-specific accessibility workarounds.
 *   - `env.*` for test-environment gating.
 */

/** Operating system. */
export const os = {
  /** macOS desktop. Excludes iPadOS, which reports as `MacIntel`. */
  mac,
  /** iPhone, iPad (including iPadOS 13+ reporting as macOS), iPod. */
  ios,
  /** Android phones, tablets, and embedded Android browsers. */
  android,
  /** Windows desktop. */
  windows,
  /** Linux desktop (including Chrome OS). */
  linux,
  /** Any Apple OS (`mac || ios`). */
  apple: mac || ios,
} as const;

/** Rendering engine. */
export const engine = {
  /** WebKit: Safari, all iOS browsers, GNOME Web. Excludes Blink. */
  webkit,
  /** Blink: Chrome, Edge, Opera, Brave, and other Chromium-based browsers. */
  blink,
  /** Gecko: Firefox. */
  gecko,
} as const;

/** Pointer / input modality. */
export const pointer = {
  /**
   * Device has hover capability — true on desktops and hybrid laptops with
   * a mouse, false on touch-only devices like phones. Derived from
   * `(hover: none)`. Use this for *modality* decisions (e.g. hover vs. tap
   * UX). Defaults to `true` in SSR (assume desktop).
   */
  hover: !noHover,
  /**
   * Device can dispatch touch events (the `Touch` constructor exists). True
   * on hybrid laptops with a touchscreen even when the primary input is a
   * mouse. Use this for *capability* decisions (e.g. binding touch
   * handlers); use `hover` to choose between hover vs. tap UX.
   */
  touch: touchCapable,
  /** A coarse pointer is available (e.g. touchscreen on a hybrid laptop). */
  coarse: coarsePointer,
} as const;

/** Screen-reader environment. */
export const screenReader = {
  /**
   * The user *may* be using VoiceOver — actual activation is not
   * detectable. True on Apple platforms running WebKit, where VoiceOver's
   * virtual-cursor / NSAccessibility focus quirks apply.
   */
  voiceOver,
} as const;

/** Runtime environment. */
export const env = {
  /** Running in jsdom or HappyDOM (used by unit tests). */
  jsdom,
} as const;

/**
 * Reads `navigator.userAgent` / `navigator.platform` (legacy but universally
 * supported) into a normalized shape. In development, prefers the modern
 * `navigator.userAgentData` API on Chromium to avoid DevTools warnings about
 * the deprecated reads; that branch is dead-code-eliminated in production
 * builds to keep the bundle small.
 *
 * Returns empty/zero values when `navigator` is undefined (SSR), so every
 * derived flag safely evaluates to `false`.
 */
function readRawData(): RawNavigatorData {
  if (typeof navigator === 'undefined') {
    return { userAgent: '', platform: '', maxTouchPoints: 0 };
  }

  if (process.env.NODE_ENV !== 'production') {
    const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData | undefined })
      .userAgentData;

    if (uaData && Array.isArray(uaData.brands)) {
      return {
        userAgent: uaData.brands.map(({ brand, version }) => `${brand}/${version}`).join(' '),
        platform: uaData.platform ?? navigator.platform ?? '',
        maxTouchPoints: navigator.maxTouchPoints ?? 0,
      };
    }
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform ?? '',
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
  };
}

function matchMedia(query: string): boolean {
  return hasWindow && !!window.matchMedia?.(query).matches;
}

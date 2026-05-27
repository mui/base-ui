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

/**
 * Normalizes the modern `navigator.userAgentData` API (Chromium) and the legacy
 * `navigator.userAgent` / `navigator.platform` strings (Firefox, Safari, older
 * Chromium) into a single shape.
 *
 * Returns empty/zero values when `navigator` is undefined (SSR), so every
 * derived flag safely evaluates to `false`.
 */
function readRawData(): RawNavigatorData {
  if (typeof navigator === 'undefined') {
    return { userAgent: '', platform: '', maxTouchPoints: 0 };
  }

  // Prefer `userAgentData` when available; `navigator.userAgent` and
  // `navigator.platform` are deprecated and trigger DevTools warnings.
  const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData | undefined })
    .userAgentData;

  const userAgent =
    uaData && Array.isArray(uaData.brands)
      ? uaData.brands.map(({ brand, version }) => `${brand}/${version}`).join(' ')
      : navigator.userAgent;

  return {
    userAgent,
    platform: uaData?.platform ?? navigator.platform ?? '',
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
  };
}

function matchMedia(query: string): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.(query).matches;
}

const data = readRawData();
const lowerPlatform = data.platform.toLowerCase();

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

const touchPointer = matchMedia('(pointer: coarse) and (hover: none)');
const coarsePointer = matchMedia('(pointer: coarse)');

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
 * Platform-detection flags grouped by category. SSR-safe — every flag is
 * `false` when `navigator` is undefined.
 *
 * Pick the most precise group for the quirk you're patching:
 *   - `os.*` for OS-specific behavior (keyboard shortcuts, native menus).
 *   - `engine.*` for rendering-engine bugs (CSS, layout, focus).
 *   - `pointer.*` for input-modality assumptions.
 *   - `screenReader.*` for AT-specific accessibility workarounds.
 *   - `env.*` for test-environment gating.
 */
export const platform = {
  os: {
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
  },
  engine: {
    /** WebKit: Safari, all iOS browsers, GNOME Web. Excludes Blink. */
    webkit,
    /** Blink: Chrome, Edge, Opera, Brave, and other Chromium-based browsers. */
    blink,
    /** Gecko: Firefox. */
    gecko,
  },
  pointer: {
    /** Primary input is touch (coarse pointer + no hover capability). */
    touch: touchPointer,
    /** A coarse pointer is available (e.g. touchscreen on a hybrid laptop). */
    coarse: coarsePointer,
  },
  screenReader: {
    /**
     * The user *may* be using VoiceOver — actual activation is not
     * detectable. True on Apple platforms running WebKit, where VoiceOver's
     * virtual-cursor / NSAccessibility focus quirks apply.
     */
    voiceOver,
  },
  env: {
    /** Running in jsdom or HappyDOM (used by unit tests). */
    jsdom,
  },
} as const;

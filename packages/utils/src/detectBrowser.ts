interface NavigatorUAData {
  readonly brands: ReadonlyArray<{ brand: string; version: string }>;
  readonly mobile: boolean;
  readonly platform: string;
}

interface BrowserData {
  readonly userAgent: string;
  readonly platform: string;
  readonly maxTouchPoints: number;
}

const data = readBrowserData();

/**
 * `true` when the rendering engine is WebKit (not Blink).
 *
 * Matches: Safari (macOS, iOS), all iOS browsers (Chrome/Edge/Firefox on iOS
 * use WKWebView), and other WebKit-based browsers like GNOME Web (WebKitGTK).
 *
 * Does NOT match Chromium-based browsers (Chrome, Edge, Opera, Brave, etc.) —
 * Blink forked from WebKit in 2013 and only implements `backdrop-filter`
 * (the unprefixed name), not the `-webkit-` variant used for detection here.
 */
export const isWebKit =
  typeof CSS !== 'undefined' && !!CSS.supports?.('-webkit-backdrop-filter:none');

/** `true` in Firefox (Gecko engine). */
export const isFirefox = /firefox/i.test(data.userAgent);

/**
 * `true` on iPhone, iPad, and iPod — including iPadOS 13+ which reports
 * itself as macOS (disambiguated via `maxTouchPoints`).
 */
export const isIOS =
  (data.platform === 'MacIntel' && data.maxTouchPoints > 1) ||
  /iP(hone|ad|od)|iOS/.test(data.platform);

/**
 * `true` on macOS desktop only. iPadOS reporting itself as macOS is excluded
 * (it satisfies {@link isIOS} instead).
 */
export const isMac = data.platform.toLowerCase().startsWith('mac') && !data.maxTouchPoints;

/** `true` on Android (phones, tablets, embedded Android browsers). */
export const isAndroid = /android/i.test(data.platform) || /android/i.test(data.userAgent);

/** `true` when running in jsdom (used by unit tests). */
export const isJSDOM = data.userAgent.includes('jsdom/');

/**
 * Normalizes the modern `navigator.userAgentData` API (Chromium) and the legacy
 * `navigator.userAgent` / `navigator.platform` strings (Firefox, Safari, older
 * Chromium) into a single shape.
 *
 * Returns empty/zero values when `navigator` is undefined (SSR), so every
 * derived flag safely evaluates to `false`.
 */
function readBrowserData(): BrowserData {
  if (typeof navigator === 'undefined') {
    return { userAgent: '', platform: '', maxTouchPoints: 0 };
  }

  // Prefer `userAgentData` when available; `navigator.userAgent` and
  // `navigator.platform` are deprecated and trigger DevTools warnings.
  const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData }).userAgentData;

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

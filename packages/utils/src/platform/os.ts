import { userAgent, platform, maxTouchPoints, lowerPlatform } from './shared';

// iPadOS 13+ reports `MacIntel` for `navigator.platform`; disambiguated via
// `maxTouchPoints` so iPad is classified as iOS, not macOS.
/** iPhone, iPad (including iPadOS 13+ reporting as macOS), iPod. */
export const ios =
  lowerPlatform === 'ios' ||
  /iP(hone|ad|od)/.test(platform) ||
  (platform === 'MacIntel' && maxTouchPoints > 1);

/** Android phones, tablets, and embedded Android browsers. */
export const android = lowerPlatform === 'android' || /android/i.test(userAgent);

/** macOS desktop. Excludes iPadOS, which reports as `MacIntel`. */
export const mac = !ios && lowerPlatform.startsWith('mac');

/** Windows desktop. */
export const windows = lowerPlatform === 'windows' || /^win/i.test(platform);

/** Linux desktop (including Chrome OS). */
export const linux =
  !android &&
  (lowerPlatform === 'linux' ||
    lowerPlatform.startsWith('chrome os') ||
    /linux/i.test(platform));

/** Any Apple OS (`mac || ios`). */
export const apple = mac || ios;

interface NavigatorUAData {
  brands: Array<{ brand: string; version: string }>;
  mobile: boolean;
  platform: string;
}

const hasNavigator = typeof navigator !== 'undefined';

const userAgentData = getUserAgentData();
const nav = getNavigatorData();
const platform = getPlatform();
const userAgent = getUserAgentString();

export const isWebKit =
  typeof CSS === 'undefined' || !CSS.supports
    ? false
    : CSS.supports('-webkit-backdrop-filter:none');

export const isIOS =
  // iPads can claim to be MacIntel
  nav.platform === 'MacIntel' && nav.maxTouchPoints > 1
    ? true
    : /iP(hone|ad|od)|iOS/.test(nav.platform);

export const isFirefox = hasNavigator && /firefox/i.test(userAgent);
export const isSafari = hasNavigator && /apple/i.test(navigator.vendor);
export const isEdge =
  hasUserAgentDataBrand('Microsoft Edge') ||
  (hasNavigator && /\bEdg(?:e|A|iOS|W)?\//.test(userAgent));
export const isAndroid = (hasNavigator && /android/i.test(platform)) || /android/i.test(userAgent);
export const isMac =
  hasNavigator && platform.toLowerCase().startsWith('mac') && !navigator.maxTouchPoints;
export const isJSDOM = userAgent.includes('jsdom/');

// Avoid Chrome DevTools blue warning.
function getNavigatorData(): { platform: string; maxTouchPoints: number } {
  if (!hasNavigator) {
    return { platform: '', maxTouchPoints: -1 };
  }

  if (userAgentData?.platform) {
    return {
      platform: userAgentData.platform,
      maxTouchPoints: navigator.maxTouchPoints,
    };
  }

  return {
    platform: navigator.platform ?? '',
    maxTouchPoints: navigator.maxTouchPoints ?? -1,
  };
}

function getUserAgentString(): string {
  if (!hasNavigator) {
    return '';
  }

  return navigator.userAgent;
}

function getPlatform(): string {
  if (!hasNavigator) {
    return '';
  }

  if (userAgentData?.platform) {
    return userAgentData.platform;
  }

  return navigator.platform ?? '';
}

function getUserAgentData(): NavigatorUAData | undefined {
  if (!hasNavigator) {
    return undefined;
  }

  return (navigator as Navigator & { userAgentData?: NavigatorUAData | undefined }).userAgentData;
}

function hasUserAgentDataBrand(brandName: string): boolean {
  return userAgentData?.brands.some(({ brand }) => brand === brandName) ?? false;
}

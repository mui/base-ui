interface NavigatorUAData {
  brands: Array<{ brand: string; version: string }>;
  mobile: boolean;
  platform: string;
}

const hasNavigator = typeof navigator !== 'undefined';

const nav = getNavigatorData();
const platform = getPlatform();
const userAgent = getUserAgent();

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
export const isEdge = hasNavigator && /Edg/i.test(userAgent);
export const isAndroid = (hasNavigator && /android/i.test(platform)) || /android/i.test(userAgent);
export const isMac =
  hasNavigator && platform.toLowerCase().startsWith('mac') && !navigator.maxTouchPoints;
export const isJSDOM = userAgent.includes('jsdom/');

// Avoid Chrome DevTools blue warning.
function getNavigatorData(): { platform: string; maxTouchPoints: number } {
  if (!hasNavigator) {
    return { platform: '', maxTouchPoints: -1 };
  }

  const uaData = (navigator as any).userAgentData as NavigatorUAData | undefined;

  if (uaData?.platform) {
    return {
      platform: uaData.platform,
      maxTouchPoints: navigator.maxTouchPoints,
    };
  }

  return {
    platform: navigator.platform ?? '',
    maxTouchPoints: navigator.maxTouchPoints ?? -1,
  };
}

function getUserAgent(): string {
  if (!hasNavigator) {
    return '';
  }

  const uaData = (navigator as any).userAgentData as NavigatorUAData | undefined;

  if (uaData && Array.isArray(uaData.brands)) {
    return uaData.brands.map(({ brand, version }) => `${brand}/${version}`).join(' ');
  }

  return navigator.userAgent;
}

function getPlatform(): string {
  if (!hasNavigator) {
    return '';
  }

  const uaData = (navigator as any).userAgentData as NavigatorUAData | undefined;

  if (uaData?.platform) {
    return uaData.platform;
  }

  return navigator.platform ?? '';
}

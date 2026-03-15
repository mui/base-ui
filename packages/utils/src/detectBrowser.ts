interface NavigatorUAData {
  brands: Array<{ brand: string; version: string }>;
  mobile: boolean;
  platform: string;
}

const hasNavigator = typeof navigator !== 'undefined';
const uaData = hasNavigator
  ? ((navigator as any).userAgentData as NavigatorUAData | undefined)
  : null;
const platform = uaData?.platform ?? (hasNavigator ? (navigator.platform ?? '') : '');
const maxTouchPoints = hasNavigator ? (navigator.maxTouchPoints ?? -1) : -1;
let userAgent = '';

if (uaData && Array.isArray(uaData.brands)) {
  userAgent = uaData.brands.map(({ brand, version }) => `${brand}/${version}`).join(' ');
} else if (hasNavigator) {
  userAgent = navigator.userAgent;
}

export const isWebKit =
  typeof CSS === 'undefined' || !CSS.supports
    ? false
    : CSS.supports('-webkit-backdrop-filter:none');

export const isIOS =
  // iPads can claim to be MacIntel
  (platform === 'MacIntel' && maxTouchPoints > 1) || /iP(hone|ad|od)|iOS/.test(platform);

export const isFirefox = hasNavigator && /firefox/i.test(userAgent);
export const isSafari = hasNavigator && /apple/i.test(navigator.vendor);
export const isEdge = hasNavigator && /Edg/i.test(userAgent);
export const isAndroid = (hasNavigator && /android/i.test(platform)) || /android/i.test(userAgent);
export const isMac =
  hasNavigator && platform.toLowerCase().startsWith('mac') && !navigator.maxTouchPoints;
export const isJSDOM = userAgent.includes('jsdom/');

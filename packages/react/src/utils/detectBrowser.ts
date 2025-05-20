import { getUserAgent } from '@floating-ui/react/utils';

interface NavigatorUAData {
  brands: Array<{ brand: string; version: string }>;
  mobile: boolean;
  platform: string;
}

const nav = getNavigatorData();

export const isWebKit =
  typeof CSS === 'undefined' || !CSS.supports
    ? false
    : CSS.supports('-webkit-backdrop-filter:none');

export const isIOS =
  // iPads can claim to be MacIntel
  nav.platform === 'MacIntel' && nav.maxTouchPoints > 1
    ? true
    : /iP(hone|ad|od)|iOS/.test(nav.platform);

export const isFirefox = typeof navigator !== 'undefined' && /firefox/i.test(getUserAgent());

// Avoid Chrome DevTools blue warning.
function getNavigatorData(): { platform: string; maxTouchPoints: number } {
  if (typeof navigator === 'undefined') {
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
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
  };
}

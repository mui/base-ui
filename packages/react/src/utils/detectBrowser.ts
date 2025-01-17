import { getUserAgent } from '@floating-ui/react/utils';

interface NavigatorUAData {
  brands: Array<{ brand: string; version: string }>;
  mobile: boolean;
  platform: string;
}

// Avoid Chrome DevTools blue warning.
export function getNavigatorData(): { platform: string; maxTouchPoints: number } {
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

export function isWebKit() {
  if (typeof CSS === 'undefined' || !CSS.supports) {
    return false;
  }
  return CSS.supports('-webkit-backdrop-filter:none');
}

export function isIOS() {
  const nav = getNavigatorData();

  // iPads can claim to be MacIntel
  // https://github.com/getsentry/sentry-javascript/issues/12127
  if (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1) {
    return true;
  }

  return /iP(hone|ad|od)|iOS/.test(nav.platform);
}

export function isFirefox() {
  return /firefox/i.test(getUserAgent());
}

import { getUserAgent } from '@floating-ui/react/utils';

interface NavigatorUAData {
  brands: Array<{ brand: string; version: string }>;
  mobile: boolean;
  platform: string;
}

// Avoid Chrome DevTools blue warning.
export function getPlatform(): string {
  if (typeof navigator === 'undefined') {
    return '';
  }

  const uaData = (navigator as any).userAgentData as NavigatorUAData | undefined;

  if (uaData?.platform) {
    return uaData.platform;
  }

  return navigator.platform;
}

export function isWebKit() {
  if (typeof CSS === 'undefined' || !CSS.supports) {
    return false;
  }
  return CSS.supports('-webkit-backdrop-filter:none');
}

export function isIOS() {
  return /iP(hone|ad|od)|iOS/.test(getPlatform());
}

export function isFirefox() {
  return /firefox/i.test(getUserAgent());
}

import * as React from 'react';

let version = 17;

if ('use' in React) {
  version = 19;
}

if ('useId' in React) {
  version = 18;
}

export const reactVersion = version;

type SupportedVersions = 17 | 18 | 19;

export function isReactVersion(reactVersionToCheck: SupportedVersions): boolean {
  return reactVersion === reactVersionToCheck;
}

export function isReactVersionAtLeast(reactVersionToCheck: SupportedVersions): boolean {
  return reactVersion >= reactVersionToCheck;
}

import * as React from 'react';

export const reactMajor = parseInt(React.version, 10);

type SupportedVersions = 17 | 18 | 19;

export function isReactVersionAtLeast(reactVersionToCheck: SupportedVersions): boolean {
  return reactMajor >= reactVersionToCheck;
}

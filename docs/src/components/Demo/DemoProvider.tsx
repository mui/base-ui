'use client';

import * as React from 'react';
import { createEnhanceCodeEmphasis } from '@mui/internal-docs-infra/pipeline/enhanceCodeEmphasis';
import { CodeProviderLazy } from '@mui/internal-docs-infra/CodeProvider';

// Opt in to the `data-frame-indent` attribute that DemoContent's CSS uses
// to shift highlighted/focus frames left when collapsed. This mirrors the
// `emphasisOptions` configured for the build-time loader in next.config.ts
// so runtime-highlighted source (e.g. on variant switch) behaves the same.
const sourceEnhancers = [createEnhanceCodeEmphasis({ focusFramesMaxSize: 6 })];

export function DemoProvider({ children }: { children: React.ReactNode }) {
  return <CodeProviderLazy sourceEnhancers={sourceEnhancers}>{children}</CodeProviderLazy>;
}

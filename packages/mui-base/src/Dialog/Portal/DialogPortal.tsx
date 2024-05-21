import * as React from 'react';
import { FloatingPortal } from '@floating-ui/react';
import type { DialogPortalProps } from './DialogPortal.types';

export function DialogPortal(props: DialogPortalProps) {
  return <FloatingPortal {...props} />;
}

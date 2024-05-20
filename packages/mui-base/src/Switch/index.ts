'use client';
export { SwitchRoot as Root } from './Root/SwitchRoot';
export { useSwitchRoot } from './Root/useSwitchRoot';
export { SwitchContext } from './Root/SwitchContext';
export type {
  SwitchRootProps as RootProps,
  SwitchOwnerState as OwnerState,
  SwitchContextValue,
  UseSwitchRootParameters,
  UseSwitchRootReturnValue,
} from './Root/SwitchRoot.types';

export { SwitchThumb as Thumb } from './Thumb/SwitchThumb';
export type { SwitchThumbProps as ThumbProps } from './Thumb/SwitchThumb.types';

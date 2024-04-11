'use client';
import { combineComponentExports } from '../utils/combineComponentExports';
import { Switch as SwitchRoot } from './Switch';
import { SwitchThumb } from './SwitchThumb';

export * from './Switch.types';

export const Switch = combineComponentExports(SwitchRoot, {
  Thumb: SwitchThumb,
});

'use client';
import { Checkbox as CheckboxRoot } from './Checkbox';
import { CheckboxIndicator } from './CheckboxIndicator';
import { combineComponentExports } from '../utils/combineComponentExports';

export * from './Checkbox.types';

export const Checkbox = combineComponentExports(CheckboxRoot, {
  Indicator: CheckboxIndicator,
});

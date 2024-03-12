'use client';
import { NumberField as NumberFieldRoot } from './NumberField';
import { NumberFieldGroup } from './NumberFieldGroup';
import { NumberFieldInput } from './NumberFieldInput';
import { NumberFieldIncrement } from './NumberFieldIncrement';
import { NumberFieldDecrement } from './NumberFieldDecrement';
import { NumberFieldScrubArea } from './NumberFieldScrubArea';
import { NumberFieldScrubAreaCursor } from './NumberFieldScrubAreaCursor';

import { combineComponentExports } from '../utils/combineComponentExports';

export * from './NumberField.types';

export const NumberField = combineComponentExports(NumberFieldRoot, {
  Group: NumberFieldGroup,
  Input: NumberFieldInput,
  Increment: NumberFieldIncrement,
  Decrement: NumberFieldDecrement,
  ScrubArea: NumberFieldScrubArea,
  ScrubAreaCursor: NumberFieldScrubAreaCursor,
});

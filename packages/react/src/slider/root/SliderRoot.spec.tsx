import * as React from 'react';
import { expectType } from '@mui/types';
import { Slider } from '@base-ui-components/react/slider';

const value: number = 25;
const array = [25];

const singleValueWithOnValueChange = (
  <Slider.Root value={value} onValueChange={(v) => expectType<number, typeof v>(v)} />
);
const singleDefaultValueWithOnValueChange = (
  <Slider.Root defaultValue={25} onValueChange={(v) => expectType<number, typeof v>(v)} />
);

const arrayValueWithOnValueChange = (
  <Slider.Root value={array} onValueChange={(v) => expectType<number[], typeof v>(v)} />
);
const arrayDefaultValueWithOnValueChange = (
  <Slider.Root defaultValue={[25]} onValueChange={(v) => expectType<number[], typeof v>(v)} />
);

const singleValueWithOnValueCommitted = (
  <Slider.Root value={value} onValueCommitted={(v) => expectType<number, typeof v>(v)} />
);
const singleDefaultValueWithOnValueCommitted = (
  <Slider.Root defaultValue={25} onValueCommitted={(v) => expectType<number, typeof v>(v)} />
);

const arrayValueWithOnValueCommitted = (
  <Slider.Root value={array} onValueCommitted={(v) => expectType<number[], typeof v>(v)} />
);
const arrayDefaultValueWithOnValueCommitted = (
  <Slider.Root defaultValue={[25]} onValueCommitted={(v) => expectType<number[], typeof v>(v)} />
);

const singleValueExplicitTypeAnnotation = (
  <Slider.Root<number> onValueChange={(v) => expectType<number, typeof v>(v)} />
);
const arrayValueExplicitTypeAnnotation = (
  <Slider.Root<number[]> onValueChange={(v) => expectType<number[], typeof v>(v)} />
);

import { expectType } from '#test-utils';
import { ToggleGroup } from './ToggleGroup';

const toggleDefaultValueReadonly = (value: NonNullable<ToggleGroup.Props['defaultValue']>) =>
  expectType<readonly string[], typeof value>(value);

const toggleValueReadonly = (value: NonNullable<ToggleGroup.Props['value']>) =>
  expectType<readonly string[], typeof value>(value);

const values = ['a', 'b', 'c'];

<ToggleGroup
  value={values}
  onValueChange={(value) => {
    expectType<string[], typeof value>(value);
  }}
/>;

const readonlyValues = ['a', 'b', 'c'] as const;
type ReadonlyValue = (typeof readonlyValues)[number];

<ToggleGroup
  value={readonlyValues}
  onValueChange={(value) => {
    expectType<ReadonlyValue[], typeof value>(value);
  }}
/>;

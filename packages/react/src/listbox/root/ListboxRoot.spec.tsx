import * as React from 'react';
import { expectType } from '#test-utils';
import { Listbox } from '@base-ui/react/listbox';

// Single selection takes and emits a single value.
<Listbox.Root
  defaultValue="a"
  onValueChange={(value) => {
    expectType<string | null, typeof value>(value);
  }}
/>;

// @ts-expect-error -- single selection doesn't accept an array
<Listbox.Root defaultValue={['a']} />;

// Multiple selection takes and emits an array.
<Listbox.Root
  multiple
  defaultValue={['a']}
  onValueChange={(value) => {
    expectType<string[], typeof value>(value);
  }}
/>;

// @ts-expect-error -- multiple selection doesn't accept a single value
<Listbox.Root multiple defaultValue="a" />;

function ControlledSingle() {
  const [value, setValue] = React.useState<string | null>('a');
  return <Listbox.Root value={value} onValueChange={setValue} />;
}

function ControlledMultiple() {
  const [value, setValue] = React.useState<string[]>([]);
  return <Listbox.Root multiple value={value} onValueChange={setValue} />;
}

// `multiple="opt-in"` also takes and emits an array.
<Listbox.Root
  multiple="opt-in"
  defaultValue={['a']}
  onValueChange={(value) => {
    expectType<string[], typeof value>(value);
  }}
/>;

// @ts-expect-error -- `multiple="opt-in"` doesn't accept a single value
<Listbox.Root multiple="opt-in" defaultValue="a" />;
<Listbox.Root<string>
  onItemHighlighted={(itemValue, eventDetails) => {
    expectType<string | undefined, typeof itemValue>(itemValue);
    expectType<number, typeof eventDetails.index>(eventDetails.index);
    if (eventDetails.reason === 'pointer') {
      expectType<MouseEvent | PointerEvent, typeof eventDetails.event>(eventDetails.event);
    }
  }}
/>;

// @ts-expect-error -- the old prop name is gone
<Listbox.Root onHighlightChange={() => {}} />;

// @ts-expect-error -- Listbox has no part that displays the selected value
<Listbox.Root itemToStringLabel={(item: string) => item} />;

// @ts-expect-error -- Listbox doesn't take part in form submission
<Listbox.Root name="fruit" />;

// @ts-expect-error -- focus doesn't wrap, following the APG listbox pattern
<Listbox.Root loopFocus />;

// @ts-expect-error -- use the Item's `label` prop to override the typeahead text
<Listbox.ItemText />;

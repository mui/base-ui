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

// @ts-expect-error -- Listbox doesn't take part in form submission
<Listbox.Root name="fruit" />;

// @ts-expect-error -- focus doesn't wrap, following the APG listbox pattern
<Listbox.Root loopFocus />;

// @ts-expect-error -- use the Item's `label` prop to override the typeahead text
<Listbox.ItemText />;

// @ts-expect-error -- set the id on `Listbox.List`, which renders the listbox element
<Listbox.Root id="artists" />;

// `createItems` infers the item and value types from the data and `getValue`.
const fruits = Listbox.createItems([{ id: 'a', name: 'Apple' }], {
  getValue: (fruit) => {
    expectType<{ id: string; name: string }, typeof fruit>(fruit);
    return fruit.id;
  },
  getLabel: (fruit) => fruit.name,
  getDisabled: () => false,
});

// The value is what `getValue` returns.
<Listbox.Root items={fruits} defaultValue="a" />;

// @ts-expect-error -- the value is what `getValue` returns, not the item
<Listbox.Root items={fruits} defaultValue={{ id: 'a', name: 'Apple' }} />;

// @ts-expect-error -- the value has the type `getValue` returns
<Listbox.Root items={fruits} defaultValue={1} />;

// `getValue` returns a primitive key.
Listbox.createItems([{ id: 'a', name: 'Apple' }], {
  // @ts-expect-error -- the key must be a primitive
  getValue: (fruit) => fruit,
  getLabel: (fruit) => fruit.name,
});

// A state setter of the value type fits.
function ControlledFruits() {
  const [values, setValues] = React.useState<string[]>([]);
  const [value, setValue] = React.useState<string | null>(null);
  return (
    <React.Fragment>
      <Listbox.Root items={fruits} multiple value={values} onValueChange={setValues} />
      <Listbox.Root items={fruits} value={value} onValueChange={setValue} />
    </React.Fragment>
  );
}

// Without `value` or `defaultValue`, the value type comes from the items.
<Listbox.Root
  items={fruits}
  multiple
  onValueChange={(value) => {
    expectType<string[], typeof value>(value);
  }}
/>;

// `get` maps a value back to its item.
expectType<{ id: string; name: string } | undefined, ReturnType<typeof fruits.get>>(
  fruits.get('a'),
);

// @ts-expect-error -- `get` takes the value type
fruits.get(1);

// An array of strings or numbers is its own values.
<Listbox.Root
  items={['a', 'b']}
  multiple
  onValueChange={(value) => {
    expectType<string[], typeof value>(value);
  }}
/>;
<Listbox.Root items={[1, 2]} defaultValue={1} />;

// @ts-expect-error -- the values are the array's items
<Listbox.Root items={['a', 'b']} defaultValue={1} />;

// @ts-expect-error -- other data goes through `Listbox.createItems()`
<Listbox.Root items={[{ id: 'a' }]} />;

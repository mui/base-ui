import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';

<Combobox.Root
  selectionMode="multiple"
  // @ts-expect-error – should be an array when in multiple mode
  defaultSelectedValue="javascript"
  onSelectedValueChange={(value) => {
    value.pop();
  }}
/>;

<Combobox.Root
  selectionMode="multiple"
  defaultSelectedValue={['javascript', 'typescript']}
  onSelectedValueChange={(value) => {
    value.pop();
  }}
/>;

<Combobox.Root
  selectionMode="single"
  // @ts-expect-error – should be a scalar when in single mode
  defaultSelectedValue={['javascript', 'typescript']}
  onSelectedValueChange={(value) => {
    // @ts-expect-error – value is not an array in single mode
    value.pop();
  }}
/>;

<Combobox.Root
  selectionMode="single"
  defaultSelectedValue="javascript"
  onSelectedValueChange={(value) => {
    // @ts-expect-error – value is not an array in single mode
    value.pop();
  }}
/>;

<Combobox.Root
  selectionMode="multiple"
  onSelectedValueChange={(value) => {
    value.pop();
  }}
/>;

function App() {
  const [mode, setMode] = React.useState<'single' | 'multiple'>('single');
  return <Combobox.Root selectionMode={mode} />;
}

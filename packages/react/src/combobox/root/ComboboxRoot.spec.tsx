import * as React from 'react';
import { Combobox } from '@base-ui-components/react/combobox';

<Combobox.Root
  multiple
  // @ts-expect-error – should be an array when in multiple mode
  defaultValue="javascript"
  onValueChange={(value) => {
    value.pop();
  }}
/>;

<Combobox.Root
  multiple
  defaultValue={['javascript', 'typescript']}
  onValueChange={(value) => {
    value.pop();
  }}
/>;

<Combobox.Root
  // @ts-expect-error – should be a scalar when in single mode
  defaultValue={['javascript', 'typescript']}
  onValueChange={(value) => {
    // @ts-expect-error – value is not an array in single mode
    value.pop();
  }}
/>;

<Combobox.Root
  defaultValue="javascript"
  onValueChange={(value) => {
    // @ts-expect-error – value is not an array in single mode
    value.pop();
  }}
/>;

<Combobox.Root
  multiple
  onValueChange={(value) => {
    value.pop();
  }}
/>;

function App() {
  const [mode, setMode] = React.useState<'single' | 'multiple'>('single');
  return <Combobox.Root multiple={mode === 'multiple'} />;
}

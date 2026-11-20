import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';

const items = ['Apple', 'Banana', 'Apricot'];

export default function ImeComposition() {
  const [value, setValue] = React.useState<string | null>(() =>
    new URLSearchParams(window.location.search).get('value'),
  );

  return (
    <div style={{ padding: 40 }}>
      <Combobox.Root items={items} value={value} onValueChange={setValue}>
        <Combobox.Input aria-label="Book" />
        <Combobox.Portal>
          <Combobox.Positioner>
            <Combobox.Popup style={{ background: 'white' }}>
              <Combobox.List>
                {(item: string) => (
                  <Combobox.Item key={item} value={item} style={{ padding: 8 }}>
                    {item}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
      <output data-testid="selected">{value ?? 'null'}</output>
    </div>
  );
}

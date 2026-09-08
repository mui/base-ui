import * as React from 'react';
import { Autocomplete } from '@base-ui/react';
import './Autocomplete.css';

interface Tag {
  id: string;
  value: string;
}

const tags: Tag[] = [
  { id: 't1', value: 'feature' },
  { id: 't2', value: 'fix' },
  { id: 't3', value: 'bug' },
  { id: 't4', value: 'docs' },
  { id: 't5', value: 'internal' },
  { id: 't6', value: 'mobile' },
];

export const Basic = () => (
  <Autocomplete.Root items={tags} defaultOpen modal={false}>
    <label className="Label">
      Search tags
      <Autocomplete.Input placeholder="e.g. feature" className="Input" />
    </label>

    <Autocomplete.Portal>
      <Autocomplete.Positioner className="Positioner" sideOffset={4}>
        <Autocomplete.Popup className="Popup">
          <Autocomplete.List className="List">
            {(tag: Tag) => (
              <Autocomplete.Item key={tag.id} className="Item" value={tag}>
                {tag.value}
              </Autocomplete.Item>
            )}
          </Autocomplete.List>
        </Autocomplete.Popup>
      </Autocomplete.Positioner>
    </Autocomplete.Portal>
  </Autocomplete.Root>
);

export const Disabled = () => (
  <Autocomplete.Root items={tags} modal={false}>
    <label className="Label">
      Search tags
      <Autocomplete.Input placeholder="e.g. feature" className="Input" disabled />
    </label>
  </Autocomplete.Root>
);

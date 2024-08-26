import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { styled } from '@mui/system';
import Check from '@mui/icons-material/Check';

const data = {
  Fruits: [
    {
      value: 'apple',
      label: 'Apple',
    },
    {
      value: 'banana',
      label: 'Banana',
    },
  ],
  Vegetables: [
    {
      value: 'carrot',
      label: 'Carrot',
    },
    {
      value: 'lettuce',
      label: 'Lettuce',
    },
  ],
};

export default function UnstyledSelectIntroduction() {
  return (
    <Select.Root value="item-2">
      <SelectTrigger>Trigger</SelectTrigger>
      <Select.Backdrop />
      <Select.Positioner alignment="start" alignmentOffset={-4}>
        <SelectPopup>
          {Object.entries(data).map(([group, items]) => (
            <Select.Group key={group}>
              <SelectGroupLabel>{group}</SelectGroupLabel>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                  <SelectItemIndicator render={<Check fontSize="small" />} />
                </SelectItem>
              ))}
            </Select.Group>
          ))}
        </SelectPopup>
      </Select.Positioner>
    </Select.Root>
  );
}

const SelectTrigger = styled(Select.Trigger)`
  font-family: 'IBM Plex Sans', sans-serif;
  padding: 6px 12px;
  border-radius: 5px;
  background-color: black;
  color: white;
  border: none;
  font-size: 100%;
  line-height: 1.5;
`;

const SelectPopup = styled(Select.Popup)`
  background-color: white;
  padding: 4px;
  border-radius: 5px;
  box-shadow:
    0 2px 4px rgb(0 0 0 / 0.1),
    0 0 0 1px rgb(0 0 0 / 0.1);
  max-height: var(--available-height);
  outline: 0;
`;

const SelectItem = styled(Select.Item)`
  padding: 6px 12px;
  outline: 0;
  cursor: default;
  border-radius: 4px;
  scroll-margin: 4px;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 1.5;

  &[data-highlighted],
  &[data-select='closed'][data-selected],
  &:focus {
    background-color: black;
    color: white;
  }
`;

const SelectItemIndicator = styled(Select.ItemIndicator)`
  margin-left: 8px;
`;

const SelectGroupLabel = styled(Select.GroupLabel)`
  font-weight: bold;
  padding: 4px 12px;
  cursor: default;
  user-select: none;
`;

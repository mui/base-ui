import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { styled } from '@mui/system';
import Check from '@mui/icons-material/Check';

export default function UnstyledSelectIntroduction() {
  return (
    <Select.Root value="item-2">
      <SelectTrigger>Trigger</SelectTrigger>
      <Select.Backdrop />
      <Select.Positioner alignment="start" alignmentOffset={-4}>
        <SelectPopup>
          {[...Array(100)].map((_, index) => (
            <SelectItem key={index} value={`item-${index + 1}`}>
              Item {index + 1}
              <SelectItemIndicator render={<Check fontSize="small" aria-hidden />} />
            </SelectItem>
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
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.1);
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

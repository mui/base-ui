import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import * as Field from '@base_ui/react/Field';
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

const entries = Object.entries(data);

export default function UnstyledSelectIntroduction() {
  return (
    <Field.Root validate={() => 'error'}>
      <Select.Root>
        <SelectTrigger>
          <Select.Value placeholder="Select food..." />
        </SelectTrigger>
        <Select.Backdrop />
        <Select.Positioner alignment="start" alignmentOffset={-4}>
          <SelectPopup>
            <SelectOption value="">
              Select food...
              <SelectOptionIndicator
                render={<Check fontSize="small" />}
                keepMounted={false}
              />
            </SelectOption>
            {entries.map(([group, items]) => (
              <React.Fragment key={group}>
                <hr className="border-none h-[1px] w-full bg-gray-300" />
                <Select.OptionGroup key={group}>
                  <SelectOptionGroupLabel>{group}</SelectOptionGroupLabel>
                  {items.map((item) => (
                    <SelectOption key={item.value} value={item.value}>
                      {item.label}
                      <SelectOptionIndicator
                        render={<Check fontSize="small" />}
                        keepMounted={false}
                      />
                    </SelectOption>
                  ))}
                </Select.OptionGroup>
              </React.Fragment>
            ))}
          </SelectPopup>
        </Select.Positioner>
      </Select.Root>
    </Field.Root>
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
  user-select: none;
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

const SelectOption = styled(Select.Option)`
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
  &:focus {
    background-color: black;
    color: white;
  }
`;

const SelectOptionIndicator = styled(Select.OptionIndicator)`
  margin-left: 8px;
`;

const SelectOptionGroupLabel = styled(Select.OptionGroupLabel)`
  font-weight: bold;
  padding: 4px 12px;
  cursor: default;
  user-select: none;
`;

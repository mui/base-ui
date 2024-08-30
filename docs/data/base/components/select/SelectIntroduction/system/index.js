import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { styled } from '@mui/system';
import Check from '@mui/icons-material/Check';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';

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
    {
      value: 'orange',
      label: 'Orange',
    },
    {
      value: 'pear',
      label: 'Pear',
    },
    {
      value: 'grape',
      label: 'Grape',
    },
    {
      value: 'pineapple',
      label: 'Pineapple',
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
    {
      value: 'broccoli',
      label: 'Broccoli',
    },
    {
      value: 'cauliflower',
      label: 'Cauliflower',
    },
    {
      value: 'asparagus',
      label: 'Asparagus',
    },
    {
      value: 'zucchini',
      label: 'Zucchini',
    },
  ],
};

const entries = Object.entries(data);

export default function UnstyledSelectIntroduction() {
  return (
    <Select.Root>
      <SelectTrigger aria-label="Select food">
        <Select.Value placeholder="Select food..." />
        <SelectDropdownArrow />
      </SelectTrigger>
      <Select.Backdrop />
      <Select.Positioner alignment="start" alignmentOffset={-4}>
        <SelectScrollArrow direction="up">
          <ArrowDropDown />
        </SelectScrollArrow>
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
              <hr aria-hidden className="border-none h-[1px] w-full bg-gray-300" />
              <Select.OptionGroup key={group}>
                <SelectOptionGroupLabel>{group}</SelectOptionGroupLabel>
                {items.map((item) => (
                  <SelectOption
                    key={item.value}
                    value={item.value}
                    disabled={item.value === 'banana'}
                  >
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
        <SelectScrollArrow direction="down">
          <ArrowDropDown />
        </SelectScrollArrow>
      </Select.Positioner>
    </Select.Root>
  );
}

const SelectTrigger = styled(Select.Trigger)`
  font-family: 'IBM Plex Sans', sans-serif;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-radius: 5px;
  background-color: black;
  color: white;
  border: none;
  font-size: 100%;
  line-height: 1.5;
  user-select: none;

  &:focus-visible {
    outline: 2px solid black;
    outline-offset: 2px;
  }
`;

const SelectDropdownArrow = styled(ArrowDropDown)`
  margin-right: -6px;
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
  scroll-margin: 15px;

  &[data-disabled] {
    opacity: 0.5;
  }

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

const SelectScrollArrow = styled(Select.ScrollArrow)`
  width: 100%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 15px;
  border-radius: 5px;

  &[data-direction='up'] {
    transform: rotate(180deg);
  }
`;

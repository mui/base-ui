'use client';

import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { css, styled } from '@mui/system';
import Check from '@mui/icons-material/Check';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';

function createOptions(items) {
  return items.map((item) => ({
    value: item,
    label: item[0].toUpperCase() + item.slice(1),
  }));
}

const data = {
  Fruits: createOptions(['apple', 'banana', 'orange', 'pear', 'grape', 'pineapple']),
  Vegetables: createOptions([
    'carrot',
    'lettuce',
    'broccoli',
    'cauliflower',
    'asparagus',
    'zucchini',
  ]),
};

const entries = Object.entries(data);

export default function SelectGroup() {
  return (
    <Select.Root>
      <SelectTrigger aria-label="Select food">
        <Select.Value placeholder="Select food..." />
        <SelectDropdownArrow />
      </SelectTrigger>
      <Select.Backdrop />
      <Select.Positioner sideOffset={5}>
        <SelectScrollUpArrow>
          <div>
            <ArrowDropDown />
          </div>
        </SelectScrollUpArrow>
        <SelectPopup>
          <SelectOption value="">
            <SelectOptionIndicator render={<Check />} />
            <Select.OptionText>Select food...</Select.OptionText>
          </SelectOption>
          {entries.map(([group, items]) => (
            <React.Fragment key={group}>
              <SelectSeparator />
              <Select.OptionGroup key={group}>
                <SelectOptionGroupLabel>{group}</SelectOptionGroupLabel>
                {items.map((item) => (
                  <SelectOption
                    key={item.value}
                    value={item.value}
                    disabled={item.value === 'banana'}
                  >
                    <SelectOptionIndicator render={<Check />} />
                    <Select.OptionText>{item.label}</Select.OptionText>
                  </SelectOption>
                ))}
              </Select.OptionGroup>
            </React.Fragment>
          ))}
        </SelectPopup>
        <SelectScrollDownArrow>
          <div>
            <ArrowDropDown />
          </div>
        </SelectScrollDownArrow>
      </Select.Positioner>
    </Select.Root>
  );
}

const gray = {
  300: '#e5e7eb',
};

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
  cursor: default;

  &:focus-visible {
    outline: 2px solid black;
    outline-offset: 2px;
  }
`;

const SelectDropdownArrow = styled(Select.Icon)`
  margin-left: 6px;
  font-size: 10px;
  line-height: 1;
  height: 6px;
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
  min-width: calc(var(--anchor-width) + 20px);
`;

const SelectOption = styled(Select.Option)`
  padding: 6px 16px 6px 4px;
  outline: 0;
  cursor: default;
  border-radius: 4px;
  user-select: none;
  display: flex;
  align-items: center;
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
  margin-right: 4px;
  visibility: hidden;
  width: 16px;
  height: 16px;

  &[data-selected] {
    visibility: visible;
  }
`;

const SelectOptionGroupLabel = styled(Select.OptionGroupLabel)`
  font-weight: bold;
  padding: 4px 24px;
  cursor: default;
  user-select: none;
  height: 30px;
`;

const scrollArrowStyles = css`
  width: 100%;
  height: 15px;

  &[data-side='none'] {
    height: 25px;
  }

  > div {
    position: absolute;
    background: white;
    width: 100%;
    height: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    top: 0;
  }
`;

const SelectScrollUpArrow = styled(Select.ScrollUpArrow)`
  transform: rotate(180deg);
  top: 0;
  ${scrollArrowStyles}

  &[data-side='none'] {
    top: -10px;
  }
`;

const SelectScrollDownArrow = styled(Select.ScrollDownArrow)`
  bottom: 0;
  ${scrollArrowStyles}

  &[data-side='none'] {
    bottom: -10px;
  }
`;

const SelectSeparator = styled(Select.Separator)`
  height: 1px;
  background-color: ${gray[300]};
  margin: 5px 0;
`;

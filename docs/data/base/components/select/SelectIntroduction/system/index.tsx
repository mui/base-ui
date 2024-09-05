'use client';

import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { css, styled } from '@mui/system';
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
      <Select.Positioner alignment="start" alignmentOffset={-16}>
        <SelectScrollUpArrow>
          <div>
            <ArrowDropDown />
          </div>
        </SelectScrollUpArrow>
        <SelectPopup>
          <SelectOption value="">
            <SelectOptionIndicator render={<Check />} />
            Select food...
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
                    {item.label}
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
  min-width: calc(var(--anchor-width) + 16px);
`;

const SelectOption = styled(Select.Option)`
  padding: 6px 16px 6px 4px;
  outline: 0;
  cursor: default;
  border-radius: 4px;
  scroll-margin: 4px;
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

'use client';

import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { css, styled } from '@mui/system';
import Check from '@mui/icons-material/Check';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';

export default function SelectEmpty() {
  return (
    <Select.Root>
      <SelectTrigger aria-label="Select font">
        <Select.Value placeholder="Select font..." />
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
          <SelectOption>
            <SelectOptionIndicator render={<Check />} />
            <Select.OptionText>Select font...</Select.OptionText>
          </SelectOption>
          <SelectOption value="system">
            <SelectOptionIndicator render={<Check />} />
            <Select.OptionText>System font</Select.OptionText>
          </SelectOption>
          <SelectOption value="arial">
            <SelectOptionIndicator render={<Check />} />
            <Select.OptionText>Arial</Select.OptionText>
          </SelectOption>
          <SelectOption value="roboto">
            <SelectOptionIndicator render={<Check />} />
            <Select.OptionText>Roboto</Select.OptionText>
          </SelectOption>
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

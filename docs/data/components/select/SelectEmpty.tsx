'use client';

import * as React from 'react';
import * as Select from '@base_ui/react/Select';
import { css, styled } from '@mui/system';

export default function SelectEmpty() {
  return (
    <Select.Root>
      <SelectTrigger aria-label="Select font">
        <Select.Value placeholder="Select font..." />
        <SelectDropdownArrow />
      </SelectTrigger>
      <Select.Backdrop />
      <Select.Positioner sideOffset={5}>
        <SelectScrollUpArrow
          render={(props) => (
            <div {...props}>
              <div>{props.children}</div>
            </div>
          )}
        />
        <SelectPopup>
          <SelectOption>
            <SelectOptionIndicator render={<CheckIcon />} />
            <Select.OptionText>Select font...</Select.OptionText>
          </SelectOption>
          <SelectOption value="system">
            <SelectOptionIndicator render={<CheckIcon />} />
            <Select.OptionText>System font</Select.OptionText>
          </SelectOption>
          <SelectOption value="arial">
            <SelectOptionIndicator render={<CheckIcon />} />
            <Select.OptionText>Arial</Select.OptionText>
          </SelectOption>
          <SelectOption value="roboto">
            <SelectOptionIndicator render={<CheckIcon />} />
            <Select.OptionText>Roboto</Select.OptionText>
          </SelectOption>
        </SelectPopup>
        <SelectScrollDownArrow
          render={(props) => (
            <div {...props}>
              <div>{props.children}</div>
            </div>
          )}
        />
      </Select.Positioner>
    </Select.Root>
  );
}

const CheckIcon = styled(function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
        fill="currentColor"
      />
    </svg>
  );
})`
  width: 100%;
  height: 100%;
`;

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
  max-width: var(--available-width);
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
  font-size: 10px;
  cursor: default;

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
  }
`;

const SelectScrollUpArrow = styled(Select.ScrollUpArrow)`
  ${scrollArrowStyles}

  &[data-side='none'] {
    top: -10px;

    > div {
      top: 10px;
    }
  }
`;

const SelectScrollDownArrow = styled(Select.ScrollDownArrow)`
  ${scrollArrowStyles}
  bottom: 0;

  &[data-side='none'] {
    bottom: -10px;

    > div {
      bottom: 10px;
    }
  }
`;

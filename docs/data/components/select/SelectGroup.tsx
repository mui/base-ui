'use client';

import * as React from 'react';
import { Select } from '@base_ui/react/Select';
import { css, styled } from '@mui/system';

function createOptions(items: string[]) {
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
            <Select.OptionText>Select food...</Select.OptionText>
          </SelectOption>
          {entries.map(([group, items]) => (
            <React.Fragment key={group}>
              <SelectSeparator />
              <Select.Group key={group}>
                <SelectGroupLabel>{group}</SelectGroupLabel>
                {items.map((item) => (
                  <SelectOption
                    key={item.value}
                    value={item.value}
                    disabled={item.value === 'banana'}
                  >
                    <SelectOptionIndicator render={<CheckIcon />} />
                    <Select.OptionText>{item.label}</Select.OptionText>
                  </SelectOption>
                ))}
              </Select.Group>
            </React.Fragment>
          ))}
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

const gray = {
  300: '#e5e7eb',
};

const triggerPaddingX = 6;
const popupPadding = 4;

const SelectTrigger = styled(Select.Trigger)`
  font-family: 'IBM Plex Sans', sans-serif;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${triggerPaddingX}px 12px;
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
  overflow-y: auto;
  background-color: white;
  padding: ${popupPadding}px;
  border-radius: 5px;
  box-shadow:
    0 2px 4px rgb(0 0 0 / 0.1),
    0 0 0 1px rgb(0 0 0 / 0.1);
  max-height: var(--available-height);
  outline: 0;
  min-width: min(
    calc(var(--available-width) - ${popupPadding * 2}px),
    calc(var(--anchor-width) + ${triggerPaddingX * 2 + popupPadding * 2}px)
  );
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

  &[data-side='none'] {
    scroll-margin: 15px;
  }

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

const SelectGroupLabel = styled(Select.GroupLabel)`
  font-weight: bold;
  padding: 4px 24px;
  cursor: default;
  user-select: none;
  height: 30px;
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

const SelectSeparator = styled(Select.Separator)`
  height: 1px;
  background-color: ${gray[300]};
  margin: 5px 0;
`;

'use client';
import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
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
      <Select.Portal>
        <SelectPositioner sideOffset={5}>
          <SelectScrollUpArrow />
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
          <SelectScrollDownArrow />
        </SelectPositioner>
      </Select.Portal>
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

const SelectPositioner = styled(Select.Positioner)`
  &[data-side='none'] {
    z-index: 1;
  }
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
  min-width: min(
    calc(var(--available-width) - ${popupPadding * 2}px),
    calc(var(--anchor-width) + ${triggerPaddingX * 2 + popupPadding * 2}px)
  );
  scroll-padding: ${popupPadding}px;

  &[data-side='none'] {
    scroll-padding: 15px;
  }

  --padding: 6px;
  --icon-size: 16px;
  --icon-margin: 4px;
`;

const SelectOption = styled(Select.Option)`
  outline: 0;
  cursor: default;
  border-radius: 4px;
  user-select: none;
  display: flex;
  align-items: center;
  line-height: 1.5;
  padding-block: var(--padding);
  padding-inline: calc(var(--padding) + var(--icon-margin) + var(--icon-size));

  &[data-selected] {
    padding-left: var(--padding);
  }

  &[data-disabled] {
    opacity: 0.5;
  }

  &[data-highlighted] {
    background-color: black;
    color: white;
  }
`;

const SelectOptionIndicator = styled(Select.OptionIndicator)`
  margin-right: var(--icon-margin);
  visibility: hidden;
  width: var(--icon-size);
  height: var(--icon-size);

  &[data-selected] {
    visibility: visible;
  }
`;

const scrollArrowStyles = css`
  position: relative;
  width: 100%;
  height: 15px;
  font-size: 10px;
  cursor: default;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  z-index: 1;

  &[data-side='none'] {
    &::before {
      content: '';
      display: block;
      position: absolute;
      width: 100%;
      height: calc(100% + 10px);
    }
  }
`;

const SelectScrollUpArrow = styled(Select.ScrollUpArrow)`
  ${scrollArrowStyles}

  &::before {
    top: -10px;
  }
`;

const SelectScrollDownArrow = styled(Select.ScrollDownArrow)`
  ${scrollArrowStyles}
  bottom: 0;

  &::before {
    top: 0;
  }
`;

const SelectGroupLabel = styled(Select.GroupLabel)`
  font-weight: bold;
  padding: var(--padding)
    calc(var(--padding) + var(--icon-margin) + var(--icon-size));
  cursor: default;
  user-select: none;
`;

const SelectSeparator = styled(Select.Separator)`
  height: 1px;
  background-color: ${gray[300]};
  margin: 5px 0;
`;

'use client';
import * as React from 'react';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { Toggle } from '@base-ui-components/react/toggle';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Select } from '@base-ui-components/react/select';
import { Menu } from '@base-ui-components/react/menu';
import s from './toolbar.module.css';
import selectClasses from '../../(public)/(content)/react/components/select/demos/hero/css-modules/index.module.css';
import menuClasses from '../../(public)/(content)/react/components/menu/demos/hero/css-modules/index.module.css';
import '../../../demo-theme.css';

export default function App() {
  return (
    <Toolbar.Root className={s.Root}>
      <Select.Root defaultValue="sans">
        <Toolbar.Button render={<Select.Trigger />} className={selectClasses.Select}>
          <Select.Value placeholder="Sans-serif" />
          <Select.Icon className={selectClasses.SelectIcon}>
            <ChevronUpDownIcon />
          </Select.Icon>
        </Toolbar.Button>
        <Select.Portal>
          <Select.Positioner className={selectClasses.Positioner} sideOffset={8}>
            <Select.Popup className={selectClasses.Popup}>
              <Select.Arrow className={selectClasses.Arrow}>
                <ArrowSvg />
              </Select.Arrow>
              <Select.Item className={selectClasses.Item} value="sans">
                <Select.ItemIndicator className={selectClasses.ItemIndicator}>
                  <CheckIcon className={selectClasses.ItemIndicatorIcon} />
                </Select.ItemIndicator>
                <Select.ItemText className={selectClasses.ItemText}>
                  Sans-serif
                </Select.ItemText>
              </Select.Item>
              <Select.Item className={selectClasses.Item} value="serif">
                <Select.ItemIndicator className={selectClasses.ItemIndicator}>
                  <CheckIcon className={selectClasses.ItemIndicatorIcon} />
                </Select.ItemIndicator>
                <Select.ItemText className={selectClasses.ItemText}>
                  Serif
                </Select.ItemText>
              </Select.Item>
              <Select.Item className={selectClasses.Item} value="mono">
                <Select.ItemIndicator className={selectClasses.ItemIndicator}>
                  <CheckIcon className={selectClasses.ItemIndicatorIcon} />
                </Select.ItemIndicator>
                <Select.ItemText className={selectClasses.ItemText}>
                  Monospace
                </Select.ItemText>
              </Select.Item>
              <Select.Item className={selectClasses.Item} value="cursive">
                <Select.ItemIndicator className={selectClasses.ItemIndicator}>
                  <CheckIcon className={selectClasses.ItemIndicatorIcon} />
                </Select.ItemIndicator>
                <Select.ItemText className={selectClasses.ItemText}>
                  Cursive
                </Select.ItemText>
              </Select.Item>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>

      <Toolbar.Separator className={s.Separator} />

      <ToggleGroup defaultValue={[]} className={s.ToggleGroup}>
        <Toggle aria-label="Bold" value="bold" className={s.Toggle}>
          <BoldIcon className={s.Icon} />
        </Toggle>
        <Toggle aria-label="Italics" value="italics" className={s.Toggle}>
          <ItalicsIcon className={s.Icon} />
        </Toggle>
        <Toggle aria-label="Underline" value="underline" className={s.Toggle}>
          <UnderlineIcon className={s.Icon} />
        </Toggle>
      </ToggleGroup>

      <Toolbar.Separator className={s.Separator} />

      <ToggleGroup defaultValue={['left']} className={s.ToggleGroup}>
        <Toggle aria-label="Align left" value="left" className={s.Toggle}>
          <AlignLeftIcon className={s.Icon} />
        </Toggle>
        <Toggle aria-label="Align center" value="center" className={s.Toggle}>
          <AlignCenterIcon className={s.Icon} />
        </Toggle>
        <Toggle aria-label="Align right" value="right" className={s.Toggle}>
          <AlignRightIcon className={s.Icon} />
        </Toggle>
      </ToggleGroup>

      <Toolbar.Separator className={s.Separator} />

      <Menu.Root>
        <Toolbar.Button render={<Menu.Trigger />} className={s.More}>
          <MoreHorizontalIcon className={s.Icon} />
        </Toolbar.Button>
        <Menu.Portal>
          <Menu.Positioner className={menuClasses.Positioner} sideOffset={8}>
            <Menu.Popup className={menuClasses.Popup}>
              <Menu.Arrow className={menuClasses.Arrow}>
                <ArrowSvg />
              </Menu.Arrow>
              <Menu.Item className={menuClasses.Item}>Add to Library</Menu.Item>
              <Menu.Item className={menuClasses.Item}>Add to Playlist</Menu.Item>
              <Menu.Separator className={menuClasses.Separator} />
              <Menu.Item className={menuClasses.Item}>Play Next</Menu.Item>
              <Menu.Item className={menuClasses.Item}>Play Last</Menu.Item>
              <Menu.Separator className={menuClasses.Separator} />
              <Menu.Item className={menuClasses.Item}>Favorite</Menu.Item>
              <Menu.Item className={menuClasses.Item}>Share</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </Toolbar.Root>
  );
}

function AlignLeftIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <line x1="17" y1="10" x2="3" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="17" y1="18" x2="3" y2="18" />
    </svg>
  );
}

function AlignCenterIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <line x1="18" y1="10" x2="6" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="18" y1="18" x2="6" y2="18" />
    </svg>
  );
}

function AlignRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <line x1="21" y1="10" x2="7" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="21" y1="18" x2="7" y2="18" />
    </svg>
  );
}

function BoldIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  );
}

function ItalicsIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  );
}

function UnderlineIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className={selectClasses.ArrowFill}
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className={selectClasses.ArrowOuterStroke}
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className={selectClasses.ArrowInnerStroke}
      />
    </svg>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" strokeWidth="1.5" />
    </svg>
  );
}

function MoreHorizontalIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

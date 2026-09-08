import * as React from 'react';
import { Toolbar, ToggleGroup, Toggle, Select } from '@base-ui/react';
import './Toolbar.css';

function CaretUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M11 10H5l3 3.5zm0-4H5l3-3.5z" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

export const Basic = () => (
  <Toolbar.Root className="Toolbar">
    <ToggleGroup className="Group" aria-label="Alignment" defaultValue={['align-left']}>
      <Toolbar.Button
        render={<Toggle />}
        aria-label="Align left"
        value="align-left"
        className="Button"
      >
        Align Left
      </Toolbar.Button>
      <Toolbar.Button
        render={<Toggle />}
        aria-label="Align right"
        value="align-right"
        className="Button"
      >
        Align Right
      </Toolbar.Button>
    </ToggleGroup>
    <Toolbar.Separator className="Separator" />
    <Toolbar.Group className="Group" aria-label="Numerical format">
      <Toolbar.Button className="Button" aria-label="Format as currency">
        $
      </Toolbar.Button>
      <Toolbar.Button className="Button" aria-label="Format as percent">
        %
      </Toolbar.Button>
    </Toolbar.Group>
    <Toolbar.Separator className="Separator" />
    <Select.Root defaultValue="Helvetica">
      <Toolbar.Button render={<Select.Trigger />} className="Button">
        <Select.Value />
        <Select.Icon>
          <CaretUpDownIcon />
        </Select.Icon>
      </Toolbar.Button>
      <Select.Portal>
        <Select.Positioner className="Positioner" sideOffset={4} alignItemWithTrigger={false}>
          <Select.Popup className="Popup">
            <Select.Item className="Item" value="Helvetica">
              <Select.ItemIndicator className="ItemIndicator">
                <CheckIcon />
              </Select.ItemIndicator>
              <Select.ItemText className="ItemText">Helvetica</Select.ItemText>
            </Select.Item>
            <Select.Item className="Item" value="Arial">
              <Select.ItemIndicator className="ItemIndicator">
                <CheckIcon />
              </Select.ItemIndicator>
              <Select.ItemText className="ItemText">Arial</Select.ItemText>
            </Select.Item>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
    <Toolbar.Separator className="Separator" />
    <Toolbar.Link className="Link" href="#">
      Edited 51m ago
    </Toolbar.Link>
  </Toolbar.Root>
);

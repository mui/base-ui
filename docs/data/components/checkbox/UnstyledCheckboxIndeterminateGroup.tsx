'use client';
import * as React from 'react';
import { styled } from '@mui/system';
import { Checkbox as BaseCheckbox } from '@base-ui-components/react/checkbox';

const colors = ['Red', 'Green', 'Blue'];

export default function UnstyledCheckboxIndeterminateGroup() {
  const [checkedValues, setCheckedValues] = React.useState(['Green']);

  const isChecked = checkedValues.length === colors.length;
  const isIndeterminate =
    checkedValues.length !== colors.length && checkedValues.length > 0;

  const id = React.useId();

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ListRoot>
        <Checkbox
          id={id}
          aria-controls={colors.map((color) => `${id}-${color}`).join(' ')}
          indeterminate={isIndeterminate}
          checked={isChecked}
          onCheckedChange={(checked) => {
            setCheckedValues(checked ? colors : []);
          }}
        >
          <Indicator>
            {isIndeterminate ? <HorizontalRuleIcon /> : <CheckIcon />}
          </Indicator>
        </Checkbox>
        <Label htmlFor={id} onMouseDown={(event) => event.preventDefault()}>
          Colors
        </Label>
      </ListRoot>
      <List>
        {colors.map((color) => (
          <ListItem key={color}>
            <Checkbox
              id={`${id}-${color}`}
              checked={checkedValues.includes(color)}
              onCheckedChange={(checked) => {
                const newCheckedValues = [...checkedValues];
                if (checked) {
                  newCheckedValues.push(color);
                } else {
                  newCheckedValues.splice(newCheckedValues.indexOf(color), 1);
                }
                setCheckedValues(newCheckedValues);
              }}
            >
              <Indicator>
                <CheckIcon />
              </Indicator>
            </Checkbox>
            <Label
              htmlFor={`${id}-${color}`}
              onMouseDown={(event) => event.preventDefault()}
            >
              {color}
            </Label>
          </ListItem>
        ))}
      </List>
    </div>
  );
}

const blue = {
  400: '#3399FF',
  600: '#0072E6',
  800: '#004C99',
};

const grey = {
  100: '#E5EAF2',
  400: '#B0B8C4',
  800: '#303740',
};

const Checkbox = styled(BaseCheckbox.Root)(
  ({ theme }) => `
    width: 24px;
    height: 24px;
    padding: 0;
    border-radius: 4px;
    border: 2px solid ${blue[600]};
    background: none;
    transition-property: background, border-color;
    transition-duration: 0.15s;
    outline: none;

    &[data-disabled] {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: 2px solid ${theme.palette.mode === 'dark' ? blue[800] : blue[400]};
      outline-offset: 2px;
    }

    &[data-checked], &[data-indeterminate] {
      border-color: transparent;
      background: ${blue[600]};
    }
  `,
);

const HorizontalRuleIcon = styled(function HorizontalRuleIcon(
  props: React.SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M4 11h16v2H4z" fill="currentColor" />
    </svg>
  );
})`
  height: 100%;
  width: 100%;
`;

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
  height: 100%;
  width: 100%;
`;

const Indicator = styled(BaseCheckbox.Indicator)`
  height: 100%;
  display: inline-block;
  visibility: hidden;
  color: ${grey[100]};

  &[data-checked],
  &[data-indeterminate] {
    visibility: visible;
  }
`;

const ListRoot = styled('div')`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const List = styled('ul')`
  list-style: none;
  padding: 0;
  margin: 0;
  margin-left: 32px;
`;

const ListItem = styled('li')`
  display: flex;
  align-items: center;

  &:not(:last-child) {
    margin-bottom: 8px;
  }
`;

const Label = styled('label')(
  ({ theme }) => `
    padding-left: 8px;
    color: ${theme.palette.mode === 'dark' ? grey[400] : grey[800]};
  `,
);

'use client';
import * as React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui-components/react/checkbox';
import { CheckboxGroup } from '@base-ui-components/react/checkbox-group';
import { Field } from '@base-ui-components/react/field';
import { styled } from '@mui/system';

const colors = ['red', 'green', 'blue'];

export default function UnstyledCheckboxGroupNested() {
  const [value, setValue] = React.useState([]);

  return (
    <Field.Root style={{ display: 'flex', flexDirection: 'column' }}>
      <CheckboxGroup.Root
        allValues={colors}
        value={value}
        onValueChange={setValue}
        preserveChildStates={false}
      >
        <CheckboxGroupLabel>Colors</CheckboxGroupLabel>
        <FieldRoot render={<ul />}>
          <Checkbox parent>
            <Indicator
              render={(props, { indeterminate }) => (
                <span {...props}>
                  {indeterminate ? <HorizontalRuleIcon /> : <CheckIcon />}
                </span>
              )}
            />
          </Checkbox>
          <CheckboxLabel>All Colors</CheckboxLabel>
        </FieldRoot>
        <List>
          {colors.map((color) => (
            <FieldListItem key={color} render={<li />}>
              <Checkbox name={color}>
                <Indicator>
                  <CheckIcon />
                </Indicator>
              </Checkbox>
              <CheckboxLabel>{color}</CheckboxLabel>
            </FieldListItem>
          ))}
        </List>
      </CheckboxGroup.Root>
    </Field.Root>
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

const CheckboxGroupLabel = styled(Field.Label)`
  display: block;
  font-weight: bold;
  font-size: 18px;
  margin-bottom: 8px;
`;

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

const HorizontalRuleIcon = styled(function HorizontalRuleIcon(props) {
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

const CheckIcon = styled(function CheckIcon(props) {
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

const FieldRoot = styled(Field.Root)`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 0;
`;

const List = styled('ul')`
  list-style: none;
  padding: 0;
  margin: 0;
  margin-left: 32px;
`;

const FieldListItem = styled(Field.Root)`
  display: flex;
  align-items: center;

  &:not(:last-child) {
    margin-bottom: 8px;
  }
`;

const CheckboxLabel = styled(Field.Label)`
  display: flex;
  gap: 8px;
  text-transform: capitalize;
  padding-left: 8px;
`;

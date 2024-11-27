'use client';
import * as React from 'react';
import { css, styled } from '@mui/system';
import { Checkbox as BaseCheckbox } from '@base-ui-components/react/checkbox';
import { CheckboxGroup } from '@base-ui-components/react/checkbox-group';
import { Field } from '@base-ui-components/react/field';

export default function UnstyledCheckboxIndeterminateGroup() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Field.Root>
        <CheckboxGroup.Root defaultValue={['red']}>
          <CheckboxGroupLabel>Colors</CheckboxGroupLabel>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <FieldRoot>
              <Checkbox name="red">
                <Indicator>
                  <CheckIcon />
                </Indicator>
              </Checkbox>
              <CheckboxLabel>Red</CheckboxLabel>
            </FieldRoot>
            <FieldRoot>
              <Checkbox name="green">
                <Indicator>
                  <CheckIcon />
                </Indicator>
              </Checkbox>
              <CheckboxLabel>Green</CheckboxLabel>
            </FieldRoot>
            <FieldRoot>
              <Checkbox name="blue">
                <Indicator>
                  <CheckIcon />
                </Indicator>
              </Checkbox>
              <CheckboxLabel>Blue</CheckboxLabel>
            </FieldRoot>
          </div>
        </CheckboxGroup.Root>
      </Field.Root>
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

const labelStyles = css`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
`;

const FieldRoot = styled(Field.Root)`
  display: flex;
`;

const CheckboxLabel = styled(Field.Label)`
  ${labelStyles}
  padding-left: 8px;
`;

const CheckboxGroupLabel = styled(Field.Label)`
  font-size: 17px;
  font-weight: bold;
  ${labelStyles}
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

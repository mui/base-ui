'use client';
import * as React from 'react';
import { NumberField as BaseNumberField } from '@base-ui-components/react/number-field';
import { styled, css } from '@mui/system';

export default function UnstyledNumberFieldFormat() {
  const id = React.useId();
  return (
    <NumberField
      id={id}
      format={{ style: 'currency', currency: 'USD' }}
      defaultValue={10}
      min={0}
    >
      <NumberLabel htmlFor={id}>Cost</NumberLabel>
      <NumberFieldGroup style={{ display: 'flex', gap: 4 }}>
        <NumberFieldDecrement>&minus;</NumberFieldDecrement>
        <NumberFieldInput />
        <NumberFieldIncrement>+</NumberFieldIncrement>
      </NumberFieldGroup>
    </NumberField>
  );
}

const blue = {
  100: '#CCE5FF',
  200: '#99CCFF',
  300: '#66B3FF',
  400: '#3399FF',
  600: '#0072E6',
  800: '#004C99',
};

const grey = {
  50: '#F9FAFB',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
};

const NumberLabel = styled('label')`
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 1rem;
  font-weight: bold;
`;

const NumberField = styled(BaseNumberField.Root)`
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 1rem;
`;

const NumberFieldGroup = styled(BaseNumberField.Group)`
  display: flex;
  align-items: center;
  margin-top: 0.25rem;
  border-radius: 0.25rem;
  border: 1px solid ${grey[300]};
  border-color: ${grey[300]};
  overflow: hidden;

  &:focus-within {
    outline: 2px solid ${blue[100]};
    border-color: ${blue[400]};
  }

  .dark & {
    border: 1px solid ${grey[700]};
    border-color: ${grey[700]};

    &:focus-within {
      outline: 2px solid ${blue[800]};
      border-color: ${blue[400]};
    }
  }
`;

const NumberFieldInput = styled(BaseNumberField.Input)`
  position: relative;
  z-index: 10;
  align-self: stretch;
  padding: 0.25rem 0.5rem;
  line-height: 1.5;
  border: none;
  background-color: #fff;
  color: ${grey[800]};
  box-shadow: 0 1px 2px 0 rgba(0 0 0 / 0.05);
  overflow: hidden;
  max-width: 150px;
  font-family: inherit;
  font-size: inherit;

  &:focus {
    outline: none;
    z-index: 10;
  }

  .dark & {
    background-color: ${grey[900]};
    border-color: ${grey[700]};
    color: ${grey[300]};

    &:focus {
      border-color: ${blue[600]};
    }
  }
`;

const buttonStyles = css`
  position: relative;
  border: none;
  font-weight: bold;
  transition-property: background-color, border-color, color;
  transition-duration: 100ms;
  padding: 0.5rem 0.75rem;
  flex: 1;
  align-self: stretch;
  background-color: ${grey[50]};
  color: ${grey[700]};
  margin: 0;
  font-family: math, sans-serif;

  &[disabled] {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .dark & {
    background-color: ${grey[800]};
    color: ${grey[300]};
    border-color: ${grey[700]};

    &[disabled] {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &:hover:not([disabled]) {
    background-color: ${grey[100]};
    border-color: ${grey[200]};
    color: ${grey[800]};
  }

  &:active:not([disabled]) {
    background-color: ${grey[200]};
  }

  .dark {
    &:hover:not([disabled]) {
      background-color: ${grey[800]};
      border-color: ${grey[700]};
      color: ${grey[200]};
    }

    &:active:not([disabled]) {
      background-color: ${grey[700]};
    }
  }
`;

const NumberFieldDecrement = styled(BaseNumberField.Decrement)`
  ${buttonStyles}
  border-right: 1px solid ${grey[200]};
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;

  .dark & {
    border-right-color: ${grey[700]};
  }
`;

const NumberFieldIncrement = styled(BaseNumberField.Increment)`
  ${buttonStyles}
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: 1px solid ${grey[200]};

  .dark & {
    border-left-color: ${grey[700]};
  }
`;

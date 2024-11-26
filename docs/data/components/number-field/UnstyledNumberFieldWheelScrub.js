'use client';
import * as React from 'react';
import { NumberField as BaseNumberField } from '@base-ui-components/react/number-field';
import { styled } from '@mui/system';

export default function UnstyledNumberFieldWheelScrub() {
  const id = React.useId();
  return (
    <NumberField id={id} defaultValue={100} allowWheelScrub>
      <NumberLabel htmlFor={id}>Amount</NumberLabel>
      <NumberFieldGroup>
        <NumberFieldInput />
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

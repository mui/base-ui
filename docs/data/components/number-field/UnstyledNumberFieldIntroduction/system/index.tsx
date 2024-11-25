'use client';
import * as React from 'react';
import { NumberField as BaseNumberField } from '@base-ui-components/react/number-field';
import { Field } from '@base-ui-components/react/field';
import { css, styled, useTheme } from '@mui/system';

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

export default function UnstyledNumberFieldIntroduction() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();
  const id = React.useId();

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Field.Root>
        <NumberField id={id}>
          <NumberFieldScrubArea>
            <NumberFieldVirtualCursor style={{ transform: 'rotate(90deg)' }}>
              <svg
                width="26"
                height="14"
                viewBox="0 0 24 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                shapeRendering="crispEdges"
              >
                <path
                  d="M19.3382 3.00223V5.40757L13.0684 5.40757L13.0683 5.40757L6.59302 5.40964V3V1.81225L5.74356 2.64241L1.65053 6.64241L1.28462 7L1.65053 7.35759L5.74356 11.3576L6.59302 12.1878V11L6.59302 8.61585L13.0684 8.61585H19.3382V11V12.1741L20.1847 11.3605L24.3465 7.36049L24.7217 6.9999L24.3464 6.63941L20.1846 2.64164L19.3382 1.82862V3.00223Z"
                  fill="black"
                  stroke="white"
                />
              </svg>
            </NumberFieldVirtualCursor>
            <Field.Label
              style={{ cursor: 'unset', color: isDarkMode ? grey[300] : grey[800] }}
            >
              Amount
            </Field.Label>
          </NumberFieldScrubArea>
          <NumberFieldGroup>
            <NumberFieldDecrement>&minus;</NumberFieldDecrement>
            <NumberFieldInput placeholder="Enter value" />
            <NumberFieldIncrement>+</NumberFieldIncrement>
          </NumberFieldGroup>
        </NumberField>
      </Field.Root>
    </div>
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

const NumberFieldScrubArea = styled(BaseNumberField.ScrubArea)`
  cursor: ns-resize;
  font-weight: bold;
  user-select: none;
`;

const NumberFieldVirtualCursor = styled(BaseNumberField.ScrubAreaCursor)`
  filter: drop-shadow(0 0 2px rgb(0 0 0 / 0.3));
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

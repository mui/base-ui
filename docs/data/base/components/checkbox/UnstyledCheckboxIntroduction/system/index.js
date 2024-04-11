import * as React from 'react';
import { styled } from '@mui/system';
import { Checkbox as BaseCheckbox } from '@base_ui/react/Checkbox';
import Check from '@mui/icons-material/Check';

export default function UnstyledSwitchIntroduction() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Checkbox aria-label="Basic checkbox, on by default" defaultChecked>
        <Indicator>
          <CheckIcon />
        </Indicator>
      </Checkbox>
      <Checkbox aria-label="Basic checkbox, off by default">
        <Indicator>
          <CheckIcon />
        </Indicator>
      </Checkbox>
      <Checkbox
        aria-label="Disabled checkbox, on by default"
        defaultChecked
        disabled
      >
        <Indicator>
          <CheckIcon />
        </Indicator>
      </Checkbox>
      <Checkbox aria-label="Disabled checkbox, off by default" disabled>
        <Indicator>
          <CheckIcon />
        </Indicator>
      </Checkbox>
    </div>
  );
}

const grey = {
  100: '#E5EAF2',
};

const blue = {
  400: '#3399FF',
  600: '#0072E6',
  800: '#004C99',
};

const Checkbox = styled(BaseCheckbox)(
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

    &[data-state="checked"], &[data-state="mixed"] {
      border-color: transparent;
      background: ${blue[600]};
    }
  `,
);

const CheckIcon = styled(Check)`
  width: 100%;
  height: 100%;
`;

const Indicator = styled(BaseCheckbox.Indicator)`
  color: ${grey[100]};
  height: 100%;
  display: inline-block;
  visibility: hidden;

  &[data-state='checked'],
  &[data-state='mixed'] {
    visibility: visible;
  }
`;

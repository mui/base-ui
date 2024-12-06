'use client';
import * as React from 'react';
import { styled } from '@mui/system';
import { Checkbox as BaseCheckbox } from '@base-ui-components/react/checkbox';

export default function UnstyledCheckboxIndeterminate() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Checkbox aria-label="Indeterminate checkbox" indeterminate>
        <Indicator>
          <HorizontalRuleIcon />
        </Indicator>
      </Checkbox>
      <Checkbox aria-label="Indeterminate disabled checkbox" indeterminate disabled>
        <Indicator>
          <HorizontalRuleIcon />
        </Indicator>
      </Checkbox>
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

    &[data-checked],
    &[data-indeterminate] {
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

const Indicator = styled(BaseCheckbox.Indicator)`
  color: ${grey[100]};
  height: 100%;
  display: inline-block;
  visibility: hidden;

  &[data-checked],
  &[data-indeterminate] {
    visibility: visible;
  }
`;

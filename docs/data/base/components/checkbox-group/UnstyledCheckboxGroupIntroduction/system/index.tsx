import * as React from 'react';
import { css, styled } from '@mui/system';
import * as BaseCheckbox from '@base_ui/react/Checkbox';
import * as CheckboxGroup from '@base_ui/react/CheckboxGroup';
import Check from '@mui/icons-material/Check';

export default function UnstyledCheckboxIndeterminateGroup() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <CheckboxGroup.Root defaultValue={['red']}>
        <CheckboxGroupLabel>Colors</CheckboxGroupLabel>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <CheckboxLabel>
            <Checkbox name="red">
              <Indicator>
                <CheckIcon />
              </Indicator>
            </Checkbox>
            Red
          </CheckboxLabel>
          <CheckboxLabel>
            <Checkbox name="green">
              <Indicator>
                <CheckIcon />
              </Indicator>
            </Checkbox>
            Green
          </CheckboxLabel>
          <CheckboxLabel>
            <Checkbox name="blue">
              <Indicator>
                <CheckIcon />
              </Indicator>
            </Checkbox>
            Blue
          </CheckboxLabel>
        </div>
      </CheckboxGroup.Root>
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

const CheckboxLabelStyled = styled('label')`
  ${labelStyles}
`;

const CheckboxGroupLabel = styled(CheckboxGroup.Label)`
  font-size: 17px;
  font-weight: bold;
  ${labelStyles}
`;

function CheckboxLabel(props: React.ComponentPropsWithoutRef<'label'>) {
  return <CheckboxLabelStyled onMouseDown={(e) => e.preventDefault()} {...props} />;
}

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

    &[data-state="checked"], &[data-state="mixed"] {
      border-color: transparent;
      background: ${blue[600]};
    }
  `,
);

const CheckIcon = styled(Check)`
  height: 100%;
  width: 100%;
`;

const Indicator = styled(BaseCheckbox.Indicator)`
  height: 100%;
  display: inline-block;
  visibility: hidden;
  color: ${grey[100]};

  &[data-state='checked'],
  &[data-state='mixed'] {
    visibility: visible;
  }
`;

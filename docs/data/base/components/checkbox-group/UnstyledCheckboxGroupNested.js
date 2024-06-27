import * as React from 'react';
import { styled } from '@mui/system';
import * as BaseCheckbox from '@base_ui/react/Checkbox';
import * as CheckboxGroup from '@base_ui/react/CheckboxGroup';
import HorizontalRule from '@mui/icons-material/HorizontalRule';
import Check from '@mui/icons-material/Check';

const colors = ['red', 'green', 'blue'];

export default function UnstyledCheckboxGroupNested() {
  const [value, setValue] = React.useState([]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <CheckboxGroup.Root allValues={colors} value={value} onValueChange={setValue}>
        <CheckboxGroupLabel>Colors</CheckboxGroupLabel>
        <ListRoot>
          <Label onMouseDown={(e) => e.preventDefault()}>
            <Checkbox parent>
              <Indicator
                render={(props, { indeterminate }) => (
                  <Indicator {...props}>
                    {indeterminate ? <HorizontalRuleIcon /> : <CheckIcon />}
                  </Indicator>
                )}
              />
            </Checkbox>
            All Colors
          </Label>
        </ListRoot>
        <List>
          {colors.map((color) => (
            <ListItem key={color}>
              <Label onMouseDown={(e) => e.preventDefault()}>
                <Checkbox name={color}>
                  <Indicator>
                    <CheckIcon />
                  </Indicator>
                </Checkbox>
                {color}
              </Label>
            </ListItem>
          ))}
        </List>
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

const CheckboxGroupLabel = styled(CheckboxGroup.Label)`
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

    &[data-state="checked"], &[data-state="mixed"] {
      border-color: transparent;
      background: ${blue[600]};
    }
  `,
);

const HorizontalRuleIcon = styled(HorizontalRule)`
  height: 100%;
  width: 100%;
`;

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

const Label = styled('label')`
  display: flex;
  gap: 8px;
  text-transform: capitalize;
`;

import * as React from 'react';
import { styled } from '@mui/system';
import { Checkbox as BaseCheckbox } from '@base_ui/react/Checkbox';
import HorizontalRule from '@mui/icons-material/HorizontalRule';
import Check from '@mui/icons-material/Check';

const colors = ['Red', 'Green', 'Blue'];

export default function UnstyledCheckboxIndeterminateGroup() {
  const [checkedValues, setCheckedValues] = React.useState([false, true, false]);

  const isChecked = checkedValues.every((value) => value);
  const isIndeterminate = checkedValues.some((value) => value) && !isChecked;

  const id = React.useId();

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ListRoot>
        <Checkbox
          id={id}
          aria-controls={colors.map((color) => `${id}-${color}`).join(' ')}
          indeterminate={isIndeterminate}
          checked={isChecked}
          onChange={(event) => {
            const checked = event.target.checked;
            setCheckedValues([checked, checked, checked]);
          }}
        >
          <Indicator>
            {isIndeterminate ? <HorizontalRuleIcon /> : <CheckIcon />}
          </Indicator>
        </Checkbox>
        <Label htmlFor={id} onMouseDown={(e) => e.preventDefault()}>
          Colors
        </Label>
      </ListRoot>
      <List>
        {colors.map((color, index) => (
          <ListItem key={color}>
            <Checkbox
              id={`${id}-${color}`}
              checked={checkedValues[index]}
              onChange={(event) => {
                const newCheckedValues = [...checkedValues];
                newCheckedValues[index] = event.target.checked;
                setCheckedValues(newCheckedValues);
              }}
            >
              <Indicator>
                <CheckIcon />
              </Indicator>
            </Checkbox>
            <Label
              htmlFor={`${id}-${color}`}
              onMouseDown={(e) => e.preventDefault()}
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

const Label = styled('label')(
  ({ theme }) => `
    padding-left: 8px;
    color: ${theme.palette.mode === 'dark' ? grey[400] : grey[800]};
  `,
);

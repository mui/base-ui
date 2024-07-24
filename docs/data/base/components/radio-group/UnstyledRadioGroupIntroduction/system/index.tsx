import * as React from 'react';
import * as RadioGroup from '@base_ui/react/RadioGroup';
import { styled } from '@mui/system';

export default function UnstyledSwitchIntroduction() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        console.log(new URLSearchParams(formData as any).toString());
      }}
    >
      <RadioGroup.Root name="root" style={{ display: 'flex', gap: 8 }}>
        <Item value="1" name="light">
          <Indicator keepMounted />
          Light
        </Item>
        <Item value="2" name="medium">
          <Indicator keepMounted />
          Medium
        </Item>
        <Item value="3" name="heavy">
          <Indicator keepMounted />
          Heavy
        </Item>
      </RadioGroup.Root>
      <button>Submit</button>
    </form>
  );
}

const grey = {
  100: '#E5EAF2',
  200: '#D8E0E9',
  300: '#CBD4E2',
};

const blue = {
  400: '#3399FF',
  600: '#0072E6',
  800: '#004C99',
};

const Item = styled(RadioGroup.Item)`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background-color: ${grey[100]};
  color: black;
  cursor: pointer;
  outline: none;
  font-size: 16px;
  cursor: default;

  &:hover {
    background-color: ${grey[100]};
  }

  &:focus-visible {
    outline: 2px solid ${blue[400]};
    outline-offset: 2px;
  }

  &[data-state='checked'] {
    background-color: ${blue[600]};
    color: white;
  }
`;

const Indicator = styled(RadioGroup.Indicator)`
  border-radius: 50%;
  width: 8px;
  height: 8px;
  margin-right: 8px;
  outline: 1px solid black;

  &[data-state='checked'] {
    background-color: white;
    border: none;
    outline: none;
  }
`;

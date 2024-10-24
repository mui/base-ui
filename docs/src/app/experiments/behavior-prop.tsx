'use client';
import * as React from 'react';
import { Dialog } from '@base_ui/react/Dialog';
import { Button } from '@base_ui/react/Button';
import { Text } from '@base_ui/react/Text';
import { styled } from '@mui/system';
import { Tooltip } from '@base_ui/react/Tooltip';

export default function Demo() {
  return (
    <Dialog.Root>
      <Tooltip.Root>
        <MyButton behavior={[Dialog.Trigger, Tooltip.Trigger]}>Subscribe</MyButton>
        <Tooltip.Positioner sideOffset={7}>
          <TooltipPopup>
            This is a tooltip
            <TooltipArrow />
          </TooltipPopup>
        </Tooltip.Positioner>
      </Tooltip.Root>
      <Backdrop />
      <Popup>
        <HeaderText tag="h3" behavior={Dialog.Title}>
          Subscribe
        </HeaderText>
        <Text tag="p" behavior={Dialog.Description}>
          Enter your email address to subscribe to our newsletter.
        </Text>
        <TextField
          type="email"
          aria-label="Email address"
          placeholder="name@example.com"
        />
        <Controls>
          <MyButton behavior={Dialog.Close}>Subscribe</MyButton>
          <MyButton behavior={Dialog.Close}>Cancel</MyButton>
        </Controls>
      </Popup>
    </Dialog.Root>
  );
}

const grey = {
  900: '#0f172a',
  800: '#1e293b',
  700: '#334155',
  500: '#64748b',
  300: '#cbd5e1',
  200: '#e2e8f0',
  100: '#f1f5f9',
  50: '#f8fafc',
};

const MyButton = styled(Button)(
  ({ theme }) => `
  background-color: ${theme.palette.mode === 'dark' ? grey[50] : grey[900]};
  color: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-family: "IBM Plex Sans", sans-serif;

  &:hover {
    background-color: ${theme.palette.mode === 'dark' ? grey[200] : grey[700]};
  }
`,
);

const Popup = styled(Dialog.Popup)(
  ({ theme }) => `
  background: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[100]};
  min-width: 400px;
  border-radius: 4px;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 18px 50px -10px;
  position: fixed;
  top: 50%;
  left: 50%;
  font-family: "IBM Plex Sans", sans-serif;
  transform: translate(-50%, -50%);
  padding: 16px;
  z-index: 2100;
`,
);

const Controls = styled('div')(
  ({ theme }) => `
  display: flex;
  flex-direction: row-reverse;
  background: ${theme.palette.mode === 'dark' ? grey[800] : grey[100]};
  gap: 8px;
  padding: 16px;
  margin: 32px -16px -16px;
`,
);

const HeaderText = styled(Text)`
  font-size: 1.25rem;
`;

const Backdrop = styled(Dialog.Backdrop)`
  background: rgb(0 0 0 / 0.35);
  position: fixed;
  inset: 0;
  backdrop-filter: blur(4px);
  z-index: 2000;
`;

const TextField = styled('input')`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid ${grey[300]};
  font-family: 'IBM Plex Sans', sans-serif;
  margin: 16px 0;
  width: 100%;
  box-sizing: border-box;
`;

export const TooltipPopup = styled(Tooltip.Popup)`
  ${({ theme }) => `
    background: ${theme.palette.mode === 'dark' ? 'white' : 'black'};
    color: ${theme.palette.mode === 'dark' ? 'black' : 'white'};
    padding: 4px 6px;
    border-radius: 4px;
    font-size: 95%;
    cursor: default;
  `}
`;

export const TooltipArrow = styled(Tooltip.Arrow)`
  ${({ theme }) => `
    width: 10px;
    height: 10px;
    transform: rotate(45deg);
    background: ${theme.palette.mode === 'dark' ? 'white' : 'black'};
    z-index: -1;

    &[data-side='top'] {
      bottom: -5px;
    }
    &[data-side='right'] {
      left: -5px;
    }
    &[data-side='bottom'] {
      top: -5px;
    }
    &[data-side='left'] {
      right: -5px;
    }
  `}
`;

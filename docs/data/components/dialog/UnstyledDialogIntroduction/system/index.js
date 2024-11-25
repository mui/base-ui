'use client';
import * as React from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { styled } from '@mui/system';

export default function UnstyledDialogIntroduction() {
  return (
    <Dialog.Root>
      <TriggerButton>Subscribe</TriggerButton>
      <Backdrop />
      <Popup>
        <Title>Subscribe</Title>
        <Description>
          Enter your email address to subscribe to our newsletter.
        </Description>
        <TextField
          type="email"
          aria-label="Email address"
          placeholder="name@example.com"
        />
        <Controls>
          <CloseButton>Subscribe</CloseButton>
          <CloseButton>Cancel</CloseButton>
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

const TriggerButton = styled(Dialog.Trigger)(
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

const CloseButton = styled(Dialog.Close)(
  ({ theme }) => `
  background-color: transparent;
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[300] : grey[500]};
  color: ${theme.palette.mode === 'dark' ? grey[50] : grey[900]};
  padding: 8px 16px;
  border-radius: 4px;
  font-family: "IBM Plex Sans", sans-serif;
  min-width: 80px;

  &:hover {
    background-color: ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  }
`,
);

const Title = styled(Dialog.Title)`
  font-size: 1.25rem;
`;

const Description = styled(Dialog.Description)``;

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

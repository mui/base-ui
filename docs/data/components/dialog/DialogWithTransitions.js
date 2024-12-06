'use client';
import * as React from 'react';
import { Dialog as BaseDialog } from '@base-ui-components/react/dialog';
import { styled } from '@mui/system';

export default function DialogWithTransitions() {
  return (
    <BaseDialog.Root>
      <Trigger>Open</Trigger>
      <Popup>
        <Title>Animated dialog</Title>
        <BaseDialog.Description>
          This dialog uses CSS transitions on entry and exit.
        </BaseDialog.Description>
        <Controls>
          <Close>Close</Close>
        </Controls>
      </Popup>
      <Backdrop />
    </BaseDialog.Root>
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

const Popup = styled(BaseDialog.Popup)(
  ({ theme }) => `
  background: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[100]};
  min-width: 400px;
  border-radius: 4px;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 18px 50px -10px;
  position: fixed;
  top: 50%;
  left: 50%;
  font-family: IBM Plex Sans;
  padding: 16px;
  z-index: 2100;
  transition-property: opacity, transform;
  transition-duration: 150ms;
  transition-timing-function: ease-in;
  opacity: 0;
  transform: translate(-50%, -35%) scale(0.8);

  &[data-open] {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    transition-timing-function: ease-out;
  }

  &[data-starting-style] {
    opacity: 0;
    transform: translate(-50%, -35%) scale(0.8);
  }
`,
);

const Backdrop = styled(BaseDialog.Backdrop)`
  background-color: rgb(0 0 0 / 0.2);
  position: fixed;
  inset: 0;
  z-index: 2000;
  backdrop-filter: blur(0);
  opacity: 0;
  transition-property: opacity, backdrop-filter;
  transition-duration: 250ms;
  transition-timing-function: ease-in;

  &[data-open] {
    backdrop-filter: blur(6px);
    opacity: 1;
    transition-timing-function: ease-out;
  }

  &[data-starting-style] {
    backdrop-filter: blur(0);
    opacity: 0;
  }
`;

const Title = styled(BaseDialog.Title)`
  font-size: 1.25rem;
`;

const Trigger = styled(BaseDialog.Trigger)(
  ({ theme }) => `
  background-color: ${theme.palette.mode === 'dark' ? grey[50] : grey[900]};
  color: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-family:
    "IBM Plex Sans",
    sans-serif;

  &:hover {
    background-color: ${theme.palette.mode === 'dark' ? grey[200] : grey[700]};
  }
`,
);

const Close = styled(BaseDialog.Close)(
  ({ theme }) => `
  background-color: transparent;
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[300] : grey[500]};
  color: ${theme.palette.mode === 'dark' ? grey[50] : grey[900]};
  padding: 8px 16px;
  border-radius: 4px;
  font-family: IBM Plex Sans, sans-serif;
  min-width: 80px;

  &:hover {
    background-color: ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  }
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

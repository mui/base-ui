'use client';
import * as React from 'react';
import { AlertDialog as BaseAlertDialog } from '@base-ui-components/react/alert-dialog';
import { styled } from '@mui/system';

export default function NestedAlertDialogs() {
  return (
    <BaseAlertDialog.Root>
      <Trigger>Open</Trigger>
      <Backdrop />
      <Popup>
        <Title>Alert Dialog 1</Title>
        <Controls>
          <BaseAlertDialog.Root>
            <Trigger>Open Nested</Trigger>
            <Backdrop />
            <Popup>
              <Title>Alert Dialog 2</Title>
              <Controls>
                <BaseAlertDialog.Root>
                  <Trigger>Open Nested</Trigger>
                  <Backdrop />
                  <Popup>
                    <Title>Alert Dialog 3</Title>
                    <Controls>
                      <Close>Close</Close>
                    </Controls>
                  </Popup>
                </BaseAlertDialog.Root>
                <Close>Close</Close>
              </Controls>
            </Popup>
          </BaseAlertDialog.Root>
          <Close>Close</Close>
        </Controls>
      </Popup>
    </BaseAlertDialog.Root>
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

const Popup = styled(BaseAlertDialog.Popup)(
  ({ theme }) => `
  --transition-duration: 150ms;
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
  transform: translate(-50%, -35%) scale(0.8, calc(pow(0.95, var(--nested-dialogs))))
    translateY(calc(-30px * var(--nested-dialogs)));
  visibility: hidden;
  opacity: 0.5;
  transition:
    transform var(--transition-duration) ease-in,
    opacity var(--transition-duration) ease-in,
    visibility var(--transition-duration) step-end;

  &[data-open] {
    @starting-style {
      & {
        transform: translate(-50%, -35%) scale(0.8) translateY(0);
        opacity: 0.5;
      }
    }

    visibility: visible;
    opacity: 1;
    transform: translate(-50%, -50%) scale(calc(pow(0.95, var(--nested-dialogs))))
      translateY(calc(-30px * var(--nested-dialogs)));
    transition:
      transform var(--transition-duration) ease-out,
      opacity var(--transition-duration) ease-out,
      visibility var(--transition-duration) step-start;
  }
`,
);

const Title = styled(BaseAlertDialog.Title)`
  font-size: 1.25rem;
`;

const Trigger = styled(BaseAlertDialog.Trigger)(
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

const Backdrop = styled(BaseAlertDialog.Backdrop)`
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

const Close = styled(BaseAlertDialog.Close)(
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

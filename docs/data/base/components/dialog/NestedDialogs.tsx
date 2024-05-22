import * as React from 'react';
import * as BaseDialog from '@base_ui/react/Dialog';
import { styled } from '@mui/system';

export default function NestedDialogs() {
  return (
    <BaseDialog.Root softClose>
      <Trigger>Open</Trigger>
      <Popup>
        <Title>Dialog 1</Title>
        <BaseDialog.Root softClose>
          <Trigger>Open Nested</Trigger>
          <Popup>
            <Title>Dialog 2</Title>
            <BaseDialog.Root softClose>
              <Trigger>Open Nested</Trigger>
              <Popup>
                <Title>Dialog 3</Title>
                <Close>Close</Close>
              </Popup>
            </BaseDialog.Root>
            <Close>Close</Close>
          </Popup>
        </BaseDialog.Root>
        <Close>Close</Close>
      </Popup>
    </BaseDialog.Root>
  );
}

const Popup = styled(BaseDialog.Popup)`
  --transition-duration: 150ms;

  background: #fff;
  border: 1px solid #f5f5f5;
  min-width: 300px;
  max-width: 500px;
  border-radius: 4px;
  box-shadow: rgba(0, 0, 0, 0.2) 0px 18px 50px -10px;
  position: fixed;
  top: 50%;
  left: 50%;
  padding: 16px;
  font-family: IBM Plex Sans;
  z-index: 1;
  transform: translate(-50%, -50%);
  opacity: calc(pow(0.95, var(--nested-dialogs)));
  transform: translate(-50%, -35%) scale(0.8, calc(pow(0.95, var(--nested-dialogs))))
    translateY(calc(-30px * var(--nested-dialogs)));
  visibility: hidden;
  opacity: 0.5;
  transition:
    transform var(--transition-duration) ease-in,
    opacity var(--transition-duration) ease-in,
    visibility var(--transition-duration) step-end;

  &[data-state='open'] {
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
`;

const Title = styled(BaseDialog.Title)`
  font-size: 1.5rem;
  font-weight: 600;
`;

const Trigger = styled(BaseDialog.Trigger)`
  background-color: #000;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 2px;
  font-family: IBM Plex Sans;
  margin: 4px;
`;

const Close = styled(BaseDialog.Close)`
  background-color: #000;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 2px;
  font-family: IBM Plex Sans;
  margin: 4px;
`;

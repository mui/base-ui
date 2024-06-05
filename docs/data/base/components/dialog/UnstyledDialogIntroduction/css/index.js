import * as React from 'react';
import * as Dialog from '@base_ui/react/Dialog';
import { useTheme } from '@mui/system';

export default function UnstyledDialogIntroduction() {
  return (
    <React.Fragment>
      <Dialog.Root softClose>
        <Dialog.Trigger className="trigger">Subscribe</Dialog.Trigger>
        <Dialog.Backdrop className="backdrop" />
        <Dialog.Popup className="popup">
          <Dialog.Title className="title">Subscribe</Dialog.Title>
          <Dialog.Description>
            Enter your email address to subscribe to our newsletter.
          </Dialog.Description>
          <input
            className="textfield"
            type="email"
            aria-label="Email address"
            placeholder="name@example.com"
          />
          <div className="controls">
            <Dialog.Close className="close">Subscribe</Dialog.Close>
            <Dialog.Close className="close">Cancel</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Root>
      <Styles />
    </React.Fragment>
  );
}

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
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

function Styles() {
  // Replace this with your app logic for determining dark mode
  const isDarkMode = useIsDarkMode();

  return (
    <style>
      {`
        .popup {
          background: ${isDarkMode ? grey[900] : grey[50]};
          border: 1px solid ${isDarkMode ? grey[700] : grey[100]};
          min-width: 400px;
          border-radius: 4px;
          box-shadow: rgba(0, 0, 0, 0.2) 0px 18px 50px -10px;
          position: fixed;
          top: 50%;
          left: 50%;
          font-family: IBM Plex Sans;
          transform: translate(-50%, -50%);
          padding: 16px;
          z-index: 2100;
        }

        .trigger {
          background-color: ${isDarkMode ? grey[50] : grey[900]};
          color: ${isDarkMode ? grey[900] : grey[50]};
          padding: 8px 16px;
          border-radius: 4px;
          border: none;
          font-family:
            IBM Plex Sans,
            sans-serif;

          &:hover {
            background-color: ${isDarkMode ? grey[200] : grey[700]};
          }
        }

        .close {
          background-color: transparent;
          border: 1px solid ${isDarkMode ? grey[300] : grey[500]};
          color: ${isDarkMode ? grey[50] : grey[900]};
          padding: 8px 16px;
          border-radius: 4px;
          font-family: IBM Plex Sans, sans-serif;
          min-width: 80px;

          &:hover {
            background-color: ${isDarkMode ? grey[700] : grey[200]};
          }
        }

        .controls {
          display: flex;
          flex-direction: row-reverse;
          background: ${isDarkMode ? grey[800] : grey[100]};
          gap: 8px;
          padding: 16px;
          margin: 32px -16px -16px;
        }

        .title {
          font-size: 1.25rem;
        }

        .backdrop {
          background: rgba(0, 0, 0, 0.35);
          position: fixed;
          inset: 0;
          backdrop-filter: blur(4px);
          z-index: 2000;
        }

        .textfield {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid ${grey[300]};
          font-family: "IBM Plex Sans", sans-serif;
          margin: 16px 0;
          width: 100%;
          box-sizing: border-box;
        }
    `}
    </style>
  );
}

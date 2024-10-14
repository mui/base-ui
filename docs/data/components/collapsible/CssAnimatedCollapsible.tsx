'use client';
import * as React from 'react';
import { useTheme } from '@mui/system';
import { Collapsible } from '@base_ui/react/Collapsible';

export default function CssAnimatedCollapsible() {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="CssAnimatedCollapsible">
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger className="CssAnimatedCollapsible-trigger">
          <span className="icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 80 80"
              focusable="false"
            >
              <path d="M70.3 13.8L40 66.3 9.7 13.8z" />
            </svg>
          </span>
          Show {open ? 'less' : 'more'}
        </Collapsible.Trigger>
        <Collapsible.Content className="CssAnimatedCollapsible-content">
          <p>This is the collapsed content</p>
          <p>This is the second paragraph</p>
          <p>This is a longer sentence and also the third paragraph</p>
        </Collapsible.Content>
      </Collapsible.Root>
      <Styles />
    </div>
  );
}

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
};

function useIsDarkMode() {
  const theme = useTheme();
  return theme.palette.mode === 'dark';
}

export function Styles() {
  const isDarkMode = useIsDarkMode();
  return (
    <style suppressHydrationWarning>{`
    .CssAnimatedCollapsible {
      font-family: system-ui, sans-serif;
      line-height: 1.4;
      width: 480px;
    }

    .CssAnimatedCollapsible h3 {
      color: ${isDarkMode ? 'cyan' : 'blue'};
    }

    .CssAnimatedCollapsible-trigger {
      border: 0;
      padding: .5rem 1rem .5rem 0;
      font: inherit;
      background-color: transparent;
    }

    .CssAnimatedCollapsible-trigger:hover {
      cursor: pointer;
    }

    .CssAnimatedCollapsible-trigger .icon {
      display: inline-block;
      font-size: 60%;
      color: #000;
      background-color: ${isDarkMode ? grey[50] : grey[700]};
      padding: 0.3em 0.2em 0 0.2em;
      border: 0;
      border-radius: 50%;
      line-height: 1;
      text-align: center;
      text-indent: 0;
      transform: rotate(270deg);
      margin-right: 0.6em;
    }

    .CssAnimatedCollapsible-trigger svg {
      width: 1.25em;
      height: 1.25em;
      fill: ${isDarkMode ? grey[900] : grey[300]};
      transition: transform 0.2s ease-in;
      transform-origin: center 45%;
    }

    .CssAnimatedCollapsible-trigger[data-collapsible="open"] svg {
      transform: rotate(90deg);
    }

    .CssAnimatedCollapsible-content {
      background-color: ${isDarkMode ? grey[700] : grey[300]};
      overflow: hidden;
    }

    .CssAnimatedCollapsible-content p {
      padding: 0 1rem;
    }

    .CssAnimatedCollapsible-content[data-collapsible='open'] {
      animation: slideDown 300ms ease-out;
    }
    .CssAnimatedCollapsible-content[data-collapsible='closed'] {
      animation: slideUp 300ms ease-out;
    }

    @keyframes slideDown {
      from {
        height: 0;
      }
      to {
        height: var(--collapsible-content-height);
      }
    }

    @keyframes slideUp {
      from {
        height: var(--collapsible-content-height);
      }
      to {
        height: 0;
      }
    }
    `}</style>
  );
}

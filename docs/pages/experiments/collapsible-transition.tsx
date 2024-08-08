import * as React from 'react';
import { useTheme } from '@mui/system';
import * as Collapsible from '@base_ui/react/Collapsible';

const TRANSITION_DURATION = '350ms';

export default function CollapsibleDemo() {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="CollapsibleDemo">
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger className="MyCollapsible2-trigger">
          <span className="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" focusable="false">
              <path d="M70.3 13.8L40 66.3 9.7 13.8z" />
            </svg>
          </span>
          {open ? 'Close' : 'Open'}
        </Collapsible.Trigger>
        <Collapsible.Content className="MyCollapsible2-content">
          <p>This is the collapsed content</p>
          <p>
            Your Choice of Fried Chicken (Half), Chicken Sandwich, With Shredded cabbage & carrot
            with mustard mayonnaise And Potato Wedges
          </p>
          <p>demo: https://codepen.io/aardrian/pen/QWjBNQG</p>
          <p>https://adrianroselli.com/2020/05/disclosure-widgets.html</p>
        </Collapsible.Content>
        <Styles />
      </Collapsible.Root>
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
    .CollapsibleDemo {
      font-family: system-ui, sans-serif;
      line-height: 1.4;
    }

    .CollapsibleDemo h3 {
      color: ${isDarkMode ? 'cyan' : 'blue'};
    }

    .MyCollapsible2-trigger {
      border: .1em solid #ccc;
      padding: .5em 1em .5em .5em;
      font: inherit;
      background-color: ${grey[50]};
      border-radius: .5em .5em 0 0;
    }

    .MyCollapsible2-trigger .icon {
      display: inline-block;
      font-size: 60%;
      color: #000;
      background-color: #00f;
      padding: 0.3em 0.2em 0 0.2em;
      border: 0.2em solid #00f;
      border-radius: 50%;
      line-height: 1;
      text-align: center;
      text-indent: 0;
      transform: rotate(270deg);
      margin-right: 0.6em;
    }

    .MyCollapsible2-trigger svg {
      width: 1.25em;
      height: 1.25em;
      fill: #fff;
      transition: transform ${TRANSITION_DURATION} ease-in;
      transform-origin: center 45%;
    }

    .MyCollapsible2-trigger:hover,
    .MyCollapsible2-trigger:focus-visible {
      background-color: #666;
      color: #fff;
      outline: none;
      border-color: #666;
    }

    .MyCollapsible2-trigger:hover .icon,
    .MyCollapsible2-trigger:focus-visible .icon {
      background-color: #fff;
      outline: none;
    }

    .MyCollapsible2-trigger:hover svg,
    .MyCollapsible2-trigger:focus-visible svg {
      fill: #00f;
    }

    .MyCollapsible2-trigger[data-state='open'] svg {
      transform: rotate(90deg);
    }

    .MyCollapsible2-content {
      background-color: #eaeaea;
      overflow: hidden;
      transition: height ${TRANSITION_DURATION};
      height: 0;
    }

    .MyCollapsible2-content[data-state='open'] {
      height: var(--collapsible-content-height);
      transition: height ${TRANSITION_DURATION};
    }

    .MyCollapsible2-content[data-entering] {
      height: 0;
    }

    `}</style>
  );
}

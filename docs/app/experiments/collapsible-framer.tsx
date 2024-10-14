'use client';
import * as React from 'react';
import { useTheme } from '@mui/system';
import { Collapsible } from '@base_ui/react/Collapsible';
import { motion } from 'framer-motion';

export default function CollapsibleFramer() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="CollapsibleFramer">
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger className="FramerCollapsible-trigger">
          <span className="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" focusable="false">
              <path d="M70.3 13.8L40 66.3 9.7 13.8z" />
            </svg>
          </span>
          Trigger
        </Collapsible.Trigger>
        <Collapsible.Content
          className="FramerCollapsible-content"
          render={
            <motion.div
              key="CollapsibleContent"
              initial={false}
              animate={open ? 'open' : 'closed'}
              exit={!open ? 'open' : 'closed'}
              variants={{
                open: {
                  height: 'auto',
                  transition: { duration: 0.6, ease: 'easeOut' },
                },
                closed: {
                  height: 0,
                  transition: { duration: 0.6, ease: 'easeIn' },
                  transitionEnd: { display: 'revert-layer' },
                },
              }}
            />
          }
        >
          <p>This is the collapsed content</p>
          <p>
            Your Choice of Fried Chicken (Half), Chicken Sandwich, With Shredded cabbage & carrot
            with mustard mayonnaise And Potato Wedges
          </p>
          <p>demo: https://codepen.io/aardrian/pen/QWjBNQG</p>
          <p>https://adrianroselli.com/2020/05/disclosure-widgets.html</p>
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
    .CollapsibleFramer {
      font-family: system-ui, sans-serif;
      line-height: 1.4;
    }

    .CollapsibleFramer h3 {
      color: ${isDarkMode ? 'cyan' : 'blue'};
    }

    .FramerCollapsible-trigger {
      border: .1em solid #ccc;
      padding: .5em 1em .5em .5em;
      font: inherit;
      background-color: ${grey[50]};
      border-radius: .5em .5em 0 0;
    }

    .FramerCollapsible-trigger .icon {
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

    .FramerCollapsible-trigger svg {
      width: 1.25em;
      height: 1.25em;
      fill: #fff;
      transition: transform 0.2s ease-in;
      transform-origin: center 45%;
    }

    .FramerCollapsible-trigger:hover,
    .FramerCollapsible-trigger:focus-visible {
      background-color: #666;
      color: #fff;
      outline: none;
      border-color: #666;
    }

    .FramerCollapsible-trigger:hover .icon,
    .FramerCollapsible-trigger:focus-visible .icon {
      background-color: #fff;
      outline: none;
    }

    .FramerCollapsible-trigger:hover svg,
    .FramerCollapsible-trigger:focus-visible svg {
      fill: #00f;
    }

    .FramerCollapsible-trigger[data-state='open'] svg {
      transform: rotate(90deg);
    }

    .FramerCollapsible-content {
      background-color: #eaeaea;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    `}</style>
  );
}

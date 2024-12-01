'use client';
import * as React from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';

const DURATION = '350ms';

export default function CollapsibleDemo() {
  return (
    <div className="CollapsibleDemo">
      <div>
        <Collapsible.Root>
          <Collapsible.Trigger className="MyCollapsible-trigger">
            <span className="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 80 80"
                focusable="false"
              >
                <path d="M70.3 13.8L40 66.3 9.7 13.8z" />
              </svg>
            </span>
            Trigger (CSS animation)
          </Collapsible.Trigger>
          <Collapsible.Panel className="MyCollapsible-content cssanimation">
            <p>This is the collapsed content</p>
            <p>This component is animated with CSS @keyframe animations</p>
            <p>demo: https://codepen.io/aardrian/pen/QWjBNQG</p>
            <p>https://adrianroselli.com/2020/05/disclosure-widgets.html</p>
          </Collapsible.Panel>
        </Collapsible.Root>
      </div>

      <div>
        <Collapsible.Root>
          <Collapsible.Trigger className="MyCollapsible-trigger">
            <span className="icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 80 80"
                focusable="false"
              >
                <path d="M70.3 13.8L40 66.3 9.7 13.8z" />
              </svg>
            </span>
            Trigger (CSS transition)
          </Collapsible.Trigger>
          <Collapsible.Panel className="MyCollapsible-content csstransition">
            <p>This is the collapsed content</p>
            <p>This component is animated with CSS transitions</p>
            <p>demo: https://codepen.io/aardrian/pen/QWjBNQG</p>
            <p>https://adrianroselli.com/2020/05/disclosure-widgets.html</p>
          </Collapsible.Panel>
        </Collapsible.Root>
      </div>

      <Collapsible.Root render={<span />} className="MyCollapsible-root">
        <Collapsible.Trigger className="MyCollapsible-trigger">
          <span className="icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 80 80"
              focusable="false"
            >
              <path d="M70.3 13.8L40 66.3 9.7 13.8z" />
            </svg>
          </span>
          Trigger (root renders a span + CSS transition)
        </Collapsible.Trigger>
        <Collapsible.Panel className="MyCollapsible-content csstransition">
          <p>This is the collapsed content</p>
          <p>This component is animated with CSS transitions</p>
          <p>demo: https://codepen.io/aardrian/pen/QWjBNQG</p>
          <p>https://adrianroselli.com/2020/05/disclosure-widgets.html</p>
        </Collapsible.Panel>
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

export function Styles() {
  return (
    <style suppressHydrationWarning>{`
    .CollapsibleDemo {
      font-family: system-ui, sans-serif;
      line-height: 1.4;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .MyCollapsible-trigger {
      border: .1em solid #ccc;
      padding: .5em 1em .5em .5em;
      font: inherit;
      background-color: ${grey[50]};
      border-radius: .5em .5em 0 0;
    }

    .MyCollapsible-trigger .icon {
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

    .MyCollapsible-trigger svg {
      width: 1.25em;
      height: 1.25em;
      fill: #fff;
      transition: transform 0.2s ease-in;
      transform-origin: center 45%;
    }

    .MyCollapsible-trigger:hover,
    .MyCollapsible-trigger:focus-visible {
      background-color: #666;
      color: #fff;
      outline: none;
      border-color: #666;
    }

    .MyCollapsible-trigger:hover .icon,
    .MyCollapsible-trigger:focus-visible .icon {
      background-color: #fff;
      outline: none;
    }

    .MyCollapsible-trigger:hover svg,
    .MyCollapsible-trigger:focus-visible svg {
      fill: #00f;
    }

    .MyCollapsible-trigger[data-open] svg {
      transform: rotate(90deg);
    }

    .MyCollapsible-content {
      background-color: #eaeaea;
      overflow: hidden;
    }

    .MyCollapsible-content.cssanimation[data-open] {
      animation: slideDown ${DURATION} ease-out;
    }

    .MyCollapsible-content.cssanimation[data-closed] {
      animation: slideUp ${DURATION} ease-out;
    }

    .MyCollapsible-content.csstransition[data-open] {
      height: var(--collapsible-content-height);
      transition: height ${DURATION} ease-out;
    }

    .MyCollapsible-content.csstransition[data-closed] {
      height: 0;
      transition: height ${DURATION} ease-in;
    }

    .MyCollapsible-content.csstransition[data-starting-style] {
      height: 0;
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

'use client';
import * as React from 'react';
import * as Collapsible from '@base_ui/react/Collapsible';

const DURATION = '350ms';

export default function CollapsibleHiddenUntilFound() {
  return (
    <React.Fragment>
      <pre className="pre">
        All 3 Collapsibles contain the text &quot;May the force be with you&quot; but only the
        content in the 2nd and 3rd Collapsible will be revealed by the browser&apos;s in-page search
        (e.g. Ctrl/Cmd-F) in{' '}
        <a href="https://caniuse.com/mdn-html_global_attributes_hidden_until-found_value">
          supported browsers
        </a>
        <br />
        <br />
        All Collapsibles here are animated, but if they are opened by find-in-page, the opening
        animation will be disabled (one-off) and open instantly
        <br />
        <br />
        Collapsible #2 is animated using CSS @keyframe animation, while #3 is animated with CSS
        transitions. #3 demonstrates a possible browser bug where the matching text is not properly
        highlighted by the browser the first time that instance is matched. It only occurs with
        transitions, not @keyframe animations.
      </pre>
      <div className="CollapsibleHiddenUntilFound">
        <Collapsible.Root defaultOpen={false}>
          <Collapsible.Trigger className="MyCollapsible-trigger">
            <span className="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" focusable="false">
                <path d="M70.3 13.8L40 66.3 9.7 13.8z" />
              </svg>
            </span>
            Toggle 1
          </Collapsible.Trigger>
          <Collapsible.Content className="MyCollapsible-content csstransition">
            <p>This is the collapsed content</p>
            <p>May the force be with you</p>
          </Collapsible.Content>
          <Styles />
        </Collapsible.Root>

        <Collapsible.Root defaultOpen={false}>
          <Collapsible.Trigger className="MyCollapsible-trigger">
            <span className="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" focusable="false">
                <path d="M70.3 13.8L40 66.3 9.7 13.8z" />
              </svg>
            </span>
            Toggle 2
          </Collapsible.Trigger>
          <Collapsible.Content className="MyCollapsible-content animation" hiddenUntilFound>
            <p>This is the collapsed content</p>
            <p>May the force be with you</p>
          </Collapsible.Content>
          <Styles />
        </Collapsible.Root>

        <Collapsible.Root defaultOpen={false}>
          <Collapsible.Trigger className="MyCollapsible-trigger">
            <span className="icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" focusable="false">
                <path d="M70.3 13.8L40 66.3 9.7 13.8z" />
              </svg>
            </span>
            Toggle 3
          </Collapsible.Trigger>
          <Collapsible.Content className="MyCollapsible-content csstransition" hiddenUntilFound>
            <p>This is the collapsed content</p>
            <p>May the force be with you</p>
          </Collapsible.Content>
          <Styles />
        </Collapsible.Root>
      </div>
    </React.Fragment>
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
    .pre {
      line-height: 1.5;
      max-width: 75ch;
      white-space: pre-wrap;
      margin: 1rem 1rem 2rem;
    }

    .CollapsibleHiddenUntilFound {
      font-family: system-ui, sans-serif;
      line-height: 1.4;
      display: flex;
      flex-flow: column nowrap;
      align-items: stretch;
      width: 400px;
      margin: 2rem;
    }

    .MyCollapsible-trigger {
      border: .1em solid #ccc;
      padding: .5em 1em .5em .5em;
      font: inherit;
      background-color: ${grey[50]};
      border-radius: 0;
      text-align: left;
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
      transition: transform ${DURATION} ease-in;
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

    .MyCollapsible-trigger[data-collapsible='open'] svg {
      transform: rotate(90deg);
    }

    .MyCollapsible-content {
      background-color: #eaeaea;
      overflow: hidden;
    }

    .MyCollapsible-content.animation[data-collapsible='open'] {
      animation: slideDown ${DURATION} ease-out;
    }

    .MyCollapsible-content.animation[data-collapsible='closed'] {
      animation: slideUp ${DURATION} ease-in;
    }

    .MyCollapsible-content.csstransition[data-collapsible='open'] {
      height: var(--collapsible-content-height);
      transition: height ${DURATION} ease-out;
    }

    .MyCollapsible-content.csstransition[data-collapsible='closed'] {
      height: 0;
      transition: height ${DURATION} ease-in;
    }

    .MyCollapsible-content.csstransition[data-entering] {
      height: 0;
    }

    .MyCollapsible-content.csstransition[hidden='until-found'] {
      transition-duration: 0s !important;
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

    .MyCollapsible-trigger:not(:first-of-type) {
      margin-top: 3rem;
    }

    `}</style>
  );
}

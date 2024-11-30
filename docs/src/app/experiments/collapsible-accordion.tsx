'use client';
import * as React from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';

const TRANSITION_DURATION = '350ms';

function AccordionSection(props: {
  index: number;
  openIndex: number;
  setOpen: (nextOpenIndex: number) => void;
}) {
  const { index, openIndex, setOpen } = props;
  const isOpen = index === openIndex;
  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={() => setOpen(isOpen ? -1 : index)}
    >
      <Collapsible.Trigger className="MyCollapsible2-trigger">
        <span className="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 80 80"
            focusable="false"
          >
            <path d="M70.3 13.8L40 66.3 9.7 13.8z" />
          </svg>
        </span>
        {isOpen ? 'Close' : 'Open'} Panel {index}
      </Collapsible.Trigger>
      <Collapsible.Panel className="MyCollapsible2-content">
        <p>This is the collapsed content of Panel {index}</p>
        <p>This is the second paragraph</p>
        <p>This is the third paragraph</p>
      </Collapsible.Panel>
      <Styles />
    </Collapsible.Root>
  );
}

export default function CollapsibleAccordion() {
  const [openIndex, setOpen] = React.useState(-1);
  return (
    <div className="CollapsibleAccordion">
      <pre>
        A crude accordion where only 1 of the 3 {`<Collapsible/>`}s can be open at
        any time
        <br />
        Animated using CSS transitions
      </pre>
      {[0, 1, 2].map((index) => (
        <AccordionSection
          index={index}
          key={index}
          openIndex={openIndex}
          setOpen={setOpen}
        />
      ))}
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
    .CollapsibleAccordion {
      width: 400px;
      font-family: system-ui, sans-serif;
      line-height: 1.4;
      display: grid;
      margin: 2rem;
    }

    .CollapsibleAccordion pre {
      margin-bottom: 24px;
    }

    .MyCollapsible2-trigger {
      border: .1em solid #ccc;
      padding: .5em 1em .5em .5em;
      font: inherit;
      background-color: ${grey[50]};
      border-radius: 0;
      text-align: left;
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

    .MyCollapsible2-trigger[data-open] svg {
      transform: rotate(90deg);
    }

    .MyCollapsible2-content {
      background-color: #eaeaea;
      overflow: hidden;
      transition: height ${TRANSITION_DURATION};
      height: 0;
    }

    .MyCollapsible2-content[data-open] {
      height: var(--collapsible-content-height);
      transition: height ${TRANSITION_DURATION};
    }

    .MyCollapsible2-content[data-starting-style] {
      height: 0;
    }

    `}</style>
  );
}

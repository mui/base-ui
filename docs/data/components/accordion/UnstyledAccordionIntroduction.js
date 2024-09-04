'use client';
import * as React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as Accordion from '@base_ui/react/Accordion';

export default function UnstyledAccordionIntroduction() {
  return (
    <div className="UnstyledAccordionIntroduction">
      <Accordion.Root className="Accordion-root" aria-label="Base UI Accordion">
        <Accordion.Section className="Accordion-section">
          <Accordion.Heading className="Accordion-heading">
            <Accordion.Trigger className="Accordion-trigger">
              <span className="trigger-text">Trigger 1</span>
              <ExpandMoreIcon />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel className="Accordion-panel">
            This is the contents of Accordion.Panel 1
          </Accordion.Panel>
        </Accordion.Section>
        <Accordion.Section className="Accordion-section">
          <Accordion.Heading className="Accordion-heading">
            <Accordion.Trigger className="Accordion-trigger">
              <span className="trigger-text">Trigger 2</span>
              <ExpandMoreIcon />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel className="Accordion-panel">
            This is the contents of Accordion.Panel 2
          </Accordion.Panel>
        </Accordion.Section>
        <Accordion.Section className="Accordion-section">
          <Accordion.Heading className="Accordion-heading">
            <Accordion.Trigger className="Accordion-trigger">
              <span className="trigger-text">Trigger 3</span>
              <ExpandMoreIcon />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel className="Accordion-panel">
            This is the contents of Accordion.Panel 3
          </Accordion.Panel>
        </Accordion.Section>
      </Accordion.Root>
      <Styles />
    </div>
  );
}

function Styles() {
  return (
    <style suppressHydrationWarning>
      {`
        .UnstyledAccordionIntroduction {
          width: 40rem;
          margin: 1rem;
        }

        .Accordion-root {
          --Paper-shadow:
            0px 2px 1px -1px rgba(0, 0, 0, 0.2),
            0px 1px 1px 0px rgba(0, 0, 0, 0.14),
            0px 1px 3px 0px rgba(0, 0, 0, 0.12);

          font-family: system-ui, sans-serif;
          box-shadow: var(--Paper-shadow);
          background-color: rgba(0,0,0,0.12);
          border-radius: .3rem;
        }

        .Accordion-section {
          position: relative;
          background-color: #fff;
          color: rgba(0, 0, 0, .87);
        }

        .Accordion-section:not(:first-of-type) {
          margin-top: 1px;
        }

        .Accordion-section:first-of-type {
          border-top-left-radius: .25rem;
          border-top-right-radius: .25rem;
        }

        .Accordion-section:last-of-type {
          border-bottom-left-radius: .25rem;
          border-bottom-right-radius: .25rem;
        }

        .Accordion-heading {
          margin: 0;
        }

        .Accordion-heading:hover {
          cursor: pointer;
        }

        .Accordion-trigger {
          appearance: none;
          background-color: transparent;
          border: 0;
          color: inherit;
          padding: 0 1rem;
          position: relative;
          width: 100%;
          display: flex;
          flex-flow: row nowrap;
          align-items: center;
        }

        .Accordion-trigger:hover {
          cursor: pointer;
        }

        .Accordion-trigger:focus-visible {
          outline: 0;
          background-color: rgba(0,0,0,0.12);
        }

        .Accordion-trigger .trigger-text {
          font-size: 1rem;
          line-height: 1.5;
          margin: 12px auto 12px 0;
        }

        .Accordion-trigger[data-collapsible="open"] svg {
          transform: rotate(180deg);
        }

        .Accordion-panel {
          padding: 1rem;
        }
      `}
    </style>
  );
}

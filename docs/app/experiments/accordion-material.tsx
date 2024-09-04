import * as React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as Accordion from '@base_ui/react/Accordion';

export default function App() {
  return (
    <div className="MaterialAccordions">
      <Accordion.Root className="MyAccordion-root" aria-label="Uncontrolled Material UI Accordion">
        {[0, 1, 2, 3].map((index) => (
          <Accordion.Section className="MyAccordion-section" key={index}>
            <Accordion.Heading className="MyAccordion-heading">
              <Accordion.Trigger className="MyAccordion-trigger">
                <span className="trigger-text">Trigger {index + 1}</span>
                <ExpandMoreIcon />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel className="MyAccordion-panel">
              This is the contents of Accordion.Panel {index + 1}
            </Accordion.Panel>
          </Accordion.Section>
        ))}
      </Accordion.Root>
      <MaterialStyles />
    </div>
  );
}

function MaterialStyles() {
  return (
    <style suppressHydrationWarning>
      {`
        .MaterialAccordions {
          width: 40rem;
          margin: 1rem;
        }

        .MyAccordion-root {
          --Paper-shadow:
            0px 2px 1px -1px rgba(0, 0, 0, 0.2),
            0px 1px 1px 0px rgba(0, 0, 0, 0.14),
            0px 1px 3px 0px rgba(0, 0, 0, 0.12);

          font-family: system-ui, sans-serif;
          box-shadow: var(--Paper-shadow);
          background-color: rgba(0,0,0,0.12);
          border-radius: .3rem;
        }

        .MyAccordion-section {
          position: relative;
          background-color: #fff;
          color: rgba(0, 0, 0, .87);
        }

        .MyAccordion-section:not(:first-of-type) {
          margin-top: 1px;
        }

        .MyAccordion-section:first-of-type {
          border-top-left-radius: .25rem;
          border-top-right-radius: .25rem;
        }

        .MyAccordion-section:last-of-type {
          border-bottom-left-radius: .25rem;
          border-bottom-right-radius: .25rem;
        }

        .MyAccordion-heading {
          margin: 0;
        }

        .MyAccordion-trigger {
          appearance: none;
          background-color: transparent;
          border: 0;
          color: inherit;
          cursor: pointer;
          padding: 0 1rem;
          position: relative;
          width: 100%;
          display: flex;
          flex-flow: row nowrap;
          align-items: center;
        }

        .MyAccordion-trigger:focus-visible {
          outline: 0;
          background-color: rgba(0,0,0,0.12);
        }

        .MyAccordion-trigger .trigger-text {
          font-size: 1rem;
          line-height: 1.5;
          margin: 12px auto 12px 0;
        }

        .MyAccordion-trigger[data-state="open"] svg {
          transform: rotate(180deg);
        }

        .MyAccordion-panel {
          padding: 1rem;
        }
      `}
    </style>
  );
}

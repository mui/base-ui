'use client';
import * as React from 'react';
import * as Accordion from '@base_ui/react/Accordion';
import { ExpandMoreIcon } from './accordion';

const DURATION = '300ms';

export default function App() {
  return (
    <div className="AnimatedAccordions">
      <h3>CSS @keyframe animations + `hidden=&quot;until-found&quot;`</h3>
      <Accordion.Root
        className="MyAccordion-root"
        aria-label="Uncontrolled Material UI Accordion"
        htmlHidden="until-found"
      >
        {[0, 1, 2].map((index) => (
          <Accordion.Section className="MyAccordion-section" key={index}>
            <Accordion.Heading className="MyAccordion-heading">
              <Accordion.Trigger className="MyAccordion-trigger">
                <span className="trigger-text">Trigger {index + 1}</span>
                <ExpandMoreIcon />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel className="MyAccordion-panel cssanimation">
              <p>
                This is the contents of Accordion.Panel {index + 1}
                <br />
                It uses `hidden=&quot;until-found&quot;` and can be opened by the browser&apos;s
                in-page search
              </p>
            </Accordion.Panel>
          </Accordion.Section>
        ))}
      </Accordion.Root>

      <h3>CSS transitions</h3>
      <Accordion.Root className="MyAccordion-root" aria-label="Uncontrolled Material UI Accordion">
        {[0, 1, 2].map((index) => (
          <Accordion.Section className="MyAccordion-section" key={index}>
            <Accordion.Heading className="MyAccordion-heading">
              <Accordion.Trigger className="MyAccordion-trigger">
                <span className="trigger-text">Trigger {index + 1}</span>
                <ExpandMoreIcon />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel className="MyAccordion-panel csstransition">
              <p>This is the contents of Accordion.Panel {index + 1}</p>
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
        .AnimatedAccordions {
          width: 40rem;
          margin: 1rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
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

        .MyAccordion-trigger svg {
          transition: transform 300ms;
        }

        .MyAccordion-trigger[data-collapsible="open"] svg {
          transform: rotate(180deg);
        }

        .MyAccordion-panel {
          overflow: hidden;
        }

        .MyAccordion-panel p {
          margin: 0;
          padding: 1rem;
        }

        .MyAccordion-panel.cssanimation[data-collapsible="open"] {
          animation: slideDown ${DURATION} ease-out;
        }

        .MyAccordion-panel.cssanimation[data-collapsible="closed"] {
          animation: slideUp ${DURATION} ease-out;
        }

        @keyframes slideDown {
          from {
            height: 0;
          }
          to {
            height: var(--accordion-content-height);
          }
        }

        @keyframes slideUp {
          from {
            height: var(--accordion-content-height);
          }
          to {
            height: 0;
          }
        }

        .MyAccordion-panel.csstransition[data-collapsible="open"] {
          height: var(--accordion-content-height);
          transition: height ${DURATION} ease-out;
        }

        .MyAccordion-panel.csstransition[data-collapsible="closed"] {
          height: 0;
          transition: height ${DURATION} ease-in;
        }

        .MyAccordion-panel.csstransition[data-entering] {
          height: 0;
        }
      `}
    </style>
  );
}

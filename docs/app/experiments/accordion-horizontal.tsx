'use client';
import * as React from 'react';
import * as Accordion from '@base_ui/react/Accordion';

function classNames(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(' ');
}

export default function App() {
  const [val, setVal] = React.useState(['one']);
  return (
    <div className="HorizontalAccordionDemo">
      <h2>Horizontal LTR</h2>
      <Accordion.Root
        className="MyHorizontalAccordion-root"
        aria-label="Uncontrolled Horizontal Accordion"
        openMultiple={false}
        orientation="horizontal"
      >
        {['one', 'two', 'three'].map((value, index) => (
          <Accordion.Item className="MyHorizontalAccordion-section" key={value}>
            <Accordion.Header className="MyHorizontalAccordion-heading">
              <Accordion.Trigger className={classNames('MyHorizontalAccordion-trigger', value)}>
                <span className="trigger-text">{index + 1}</span>
                <span className="trigger-label">{value}</span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className="MyHorizontalAccordion-panel">
              This is the contents of Accordion.Panel {index + 1}
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>

      <span>
        <h2>Horizontal RTL</h2>
        <p>one section must remain open</p>
      </span>
      <Accordion.Root
        className="MyHorizontalAccordion-root"
        aria-label="Controlled Horizontal RTL Accordion"
        openMultiple={false}
        orientation="horizontal"
        direction="rtl"
        value={val}
        onOpenChange={(newValue: Accordion.Root.Props['Value']) => {
          if (newValue.length > 0) {
            setVal(newValue);
          }
        }}
      >
        {['one', 'two', 'three'].map((value, index) => (
          <Accordion.Item className="MyHorizontalAccordion-section" key={value} value={value}>
            <Accordion.Header className="MyHorizontalAccordion-heading">
              <Accordion.Trigger className={classNames('MyHorizontalAccordion-trigger', value)}>
                <span className="trigger-text">{index + 1}</span>
                <span className="trigger-label">{value}</span>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className="MyHorizontalAccordion-panel">
              This is the contents of Accordion.Panel {index + 1}
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion.Root>
      <HorizontalStyles />
    </div>
  );
}

function HorizontalStyles() {
  return (
    <style suppressHydrationWarning>
      {`
        .HorizontalAccordionDemo {
          margin: 1rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2rem;
        }

        .MyHorizontalAccordion-root {
          --Paper-shadow:
            0px 2px 1px -1px rgba(0, 0, 0, 0.2),
            0px 1px 1px 0px rgba(0, 0, 0, 0.14),
            0px 1px 3px 0px rgba(0, 0, 0, 0.12);

          font-family: system-ui, sans-serif;
          box-shadow: var(--Paper-shadow);
          background-color: rgba(0,0,0,0.12);
          border-radius: .3rem;
          height: 40rem;
          display: inline-flex;
        }

        .MyHorizontalAccordion-section {
          position: relative;
          background-color: #fff;
          color: rgba(0, 0, 0, .87);
          display: flex;
        }

        .MyHorizontalAccordion-section:not(:first-of-type) {
          margin-left: 1px;
        }

        .MyHorizontalAccordion-section:first-of-type {
          border-top-left-radius: .25rem;
          border-top-right-radius: .25rem;
        }

        .MyHorizontalAccordion-section:last-of-type {
          border-bottom-left-radius: .25rem;
          border-bottom-right-radius: .25rem;
        }

        .MyHorizontalAccordion-heading {
          margin: 0;
          width: 4rem;
        }

        .MyHorizontalAccordion-trigger {
          appearance: none;
          background-color: transparent;
          border: 0;
          color: inherit;
          cursor: pointer;
          padding: 1rem;
          position: relative;
          height: 100%;
          width: 100%;
          display: flex;
          flex-flow: column nowrap;
          align-items: center;
        }

        .MyHorizontalAccordion-trigger.one {
          background-color: #ddd;
        }

        .MyHorizontalAccordion-trigger.two {
          background-color: #bbb;
        }

        .MyHorizontalAccordion-trigger.three {
          background-color: #999;
        }

        .MyHorizontalAccordion-trigger:focus-visible {
          outline: 0;
          background-color: rgba(0,0,0,0.88);
          color: #eee;
        }

        .MyHorizontalAccordion-trigger .trigger-text {
          font-size: 1rem;
          line-height: 1.5;
          margin-bottom: auto;
        }

        .MyHorizontalAccordion-trigger .trigger-label {
          font-size: 1rem;
          line-height: 1.5;
          margin-bottom: 1rem;
          transform: rotate(-90deg);
        }

        .MyHorizontalAccordion-trigger[data-state="open"] svg {
          transform: rotate(180deg);
        }

        .MyHorizontalAccordion-panel {
          padding: 1rem;
          width: 32rem;
        }
      `}
    </style>
  );
}

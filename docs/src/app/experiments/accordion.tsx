'use client';
import * as React from 'react';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { Accordion } from '@base-ui-components/react/accordion';

export default function App() {
  const [openMultiple, setOpenMultiple] = React.useState(true);
  const [val, setVal] = React.useState<readonly (string | number)[]>(['one']);
  const [val2, setVal2] = React.useState(['one']);
  return (
    <div className="AccordionDemo">
      <span>multiple `Accordion.Item`s can be open at the same time:</span>
      <Checkbox.Root
        className="Checkbox"
        aria-label="Toggle the openMultiple boolean prop for demos"
        checked={openMultiple}
        onCheckedChange={setOpenMultiple}
      >
        <Checkbox.Indicator className="Checkbox-indicator">
          {openMultiple && <CheckIcon className="Checkbox-icon" />}
        </Checkbox.Indicator>
      </Checkbox.Root>

      <hr style={{ marginTop: 32, marginBottom: 32 }} role="presentation" />

      <h2>Uncontrolled</h2>

      <Accordion.Root
        className="MyAccordion-root"
        aria-label="Uncontrolled Accordion"
        openMultiple={openMultiple}
      >
        <Accordion.Item className="MyAccordion-item">
          <Accordion.Header className="MyAccordion-header">
            <Accordion.Trigger className="MyAccordion-trigger">
              Trigger 1
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 1
            <input type="text" />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className="MyAccordion-item">
          <Accordion.Header className="MyAccordion-header">
            <Accordion.Trigger className="MyAccordion-trigger">
              Trigger 2
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 2
            <button type="button">This button does nothing</button>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className="MyAccordion-item">
          <Accordion.Header className="MyAccordion-header">
            <Accordion.Trigger className="MyAccordion-trigger" disabled>
              Trigger 3
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 3
            <a href="https://mui.com">MUI</a>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className="MyAccordion-item">
          <Accordion.Header className="MyAccordion-header">
            <Accordion.Trigger className="MyAccordion-trigger">
              Trigger 4
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 4
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className="MyAccordion-item">
          <Accordion.Header className="MyAccordion-header">
            <Accordion.Trigger className="MyAccordion-trigger">
              Trigger 5
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 5
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>

      <hr style={{ marginTop: 32, marginBottom: 32 }} role="presentation" />

      <h2>Controlled</h2>

      <Accordion.Root
        className="MyAccordion-root"
        value={val}
        onValueChange={setVal}
        aria-label="Controlled Accordion"
        openMultiple={openMultiple}
      >
        <Accordion.Item className="MyAccordion-item" value="one">
          <Accordion.Header className="MyAccordion-header">
            <Accordion.Trigger className="MyAccordion-trigger">
              Trigger 1
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 1, the value is &quot;one&quot;
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className="MyAccordion-item" value="two">
          <Accordion.Header className="MyAccordion-header">
            <Accordion.Trigger className="MyAccordion-trigger">
              Trigger 2
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 2, the value is &quot;two&quot;
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className="MyAccordion-item" value="three">
          <Accordion.Header className="MyAccordion-header">
            <Accordion.Trigger className="MyAccordion-trigger">
              Trigger 3
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 3, the value is &quot;three&quot;
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>

      <hr style={{ marginTop: 32, marginBottom: 32 }} role="presentation" />

      <h2>Controlled, at least one section must remain open</h2>

      <Accordion.Root
        className="MyAccordion-root"
        value={val2}
        onValueChange={(newValue: Accordion.Root.Props['value']) => {
          if (Array.isArray(newValue) && newValue.length > 0) {
            setVal2(newValue);
          }
        }}
        aria-label="Controlled Accordion, one section must remain open"
        openMultiple={openMultiple}
      >
        <Accordion.Item className="MyAccordion-item" value="one">
          <Accordion.Header className="MyAccordion-header">
            <Accordion.Trigger className="MyAccordion-trigger">
              Trigger 1
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 1, the value is &quot;one&quot;
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className="MyAccordion-item" value="two">
          <Accordion.Header className="MyAccordion-header">
            <Accordion.Trigger className="MyAccordion-trigger">
              Trigger 2
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 2, the value is &quot;two&quot;
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className="MyAccordion-item" value="three">
          <Accordion.Header className="MyAccordion-header">
            <Accordion.Trigger className="MyAccordion-trigger">
              Trigger 3
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 3, the value is &quot;three&quot;
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ExpandMoreIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z" fill="currentColor" />
    </svg>
  );
}

import * as React from 'react';
import * as Accordion from '@base_ui/react/Accordion';

export default function App() {
  return (
    <div className="App AccordionDemo">
      <pre>Plain HTML</pre>
      <div role="region" className="MyAccordion-root" aria-label="My Accordion Component">
        <div className="MyAccordion-section">
          <h3 className="MyAccordion-heading">
            <button
              type="button"
              aria-controls="Panel1"
              aria-expanded="true"
              className="MyAccordion-trigger"
              id="Trigger1"
            >
              Panel 1
            </button>
          </h3>
          <div id="Panel1" className="MyAccordion-panel" role="region" aria-labelledby="Trigger1">
            This the contents of Panel 1
          </div>
        </div>

        <div className="MyAccordion-section">
          <h3 className="MyAccordion-heading">
            <button
              type="button"
              aria-controls="Panel2"
              aria-expanded="false"
              className="MyAccordion-trigger"
              id="Trigger2"
            >
              Panel 2
            </button>
          </h3>
          <div id="Panel2" className="MyAccordion-panel" role="region" aria-labelledby="Trigger2">
            This the contents of Panel 2
          </div>
        </div>
      </div>

      <br />
      <br />
      <hr />
      <br />
      <br />

      <pre>Base UI</pre>

      <Accordion.Root className="MyAccordion-root">
        <Accordion.Section className="MyAccordion-section">
          <Accordion.Heading className="MyAccordion-heading">
            <Accordion.Trigger className="MyAccordion-trigger">Trigger 1</Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 1
          </Accordion.Panel>
        </Accordion.Section>

        <Accordion.Section className="MyAccordion-section">
          <Accordion.Heading className="MyAccordion-heading">
            <Accordion.Trigger className="MyAccordion-trigger">Trigger 2</Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 2
          </Accordion.Panel>
        </Accordion.Section>
      </Accordion.Root>
    </div>
  );
}

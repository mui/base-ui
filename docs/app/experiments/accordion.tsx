'use client';
import * as React from 'react';
import * as Checkbox from '@base_ui/react/Checkbox';
import * as Accordion from '@base_ui/react/Accordion';

export default function App() {
  const [openMultiple, setOpenMultiple] = React.useState(true);
  const [val, setVal] = React.useState(['one']);
  const [val2, setVal2] = React.useState(['one']);
  return (
    <div className="AccordionDemo">
      <span>multiple `Accordion.Section`s can be open at the same time:</span>
      <Checkbox.Root
        className="Checkbox"
        aria-label="Toggle the openMultiple boolean prop for demos"
        checked={openMultiple}
        onCheckedChange={setOpenMultiple}
      >
        <Checkbox.Indicator className="Checkbox-indicator">
          <CheckIcon className="Checkbox-icon" />
        </Checkbox.Indicator>
      </Checkbox.Root>

      <hr style={{ marginTop: 32, marginBottom: 32 }} role="presentation" />

      <h2>Uncontrolled</h2>

      <Accordion.Root
        className="MyAccordion-root"
        aria-label="Uncontrolled Accordion"
        openMultiple={openMultiple}
      >
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

        <Accordion.Section className="MyAccordion-section">
          <Accordion.Heading className="MyAccordion-heading">
            <Accordion.Trigger className="MyAccordion-trigger" disabled>
              Trigger 3
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 3
          </Accordion.Panel>
        </Accordion.Section>

        <Accordion.Section className="MyAccordion-section">
          <Accordion.Heading className="MyAccordion-heading">
            <Accordion.Trigger className="MyAccordion-trigger">Trigger 4</Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 4
          </Accordion.Panel>
        </Accordion.Section>

        <Accordion.Section className="MyAccordion-section">
          <Accordion.Heading className="MyAccordion-heading">
            <Accordion.Trigger className="MyAccordion-trigger">Trigger 5</Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 5
          </Accordion.Panel>
        </Accordion.Section>
      </Accordion.Root>

      <hr style={{ marginTop: 32, marginBottom: 32 }} role="presentation" />

      <h2>Controlled</h2>

      <Accordion.Root
        className="MyAccordion-root"
        value={val}
        onOpenChange={setVal}
        aria-label="Controlled Accordion"
        openMultiple={openMultiple}
      >
        <Accordion.Section className="MyAccordion-section" value="one">
          <Accordion.Heading className="MyAccordion-heading">
            <Accordion.Trigger className="MyAccordion-trigger">Trigger 1</Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 1, the value is &quot;one&quot;
          </Accordion.Panel>
        </Accordion.Section>

        <Accordion.Section className="MyAccordion-section" value="two">
          <Accordion.Heading className="MyAccordion-heading">
            <Accordion.Trigger className="MyAccordion-trigger">Trigger 2</Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 2, the value is &quot;two&quot;
          </Accordion.Panel>
        </Accordion.Section>

        <Accordion.Section className="MyAccordion-section" value="three">
          <Accordion.Heading className="MyAccordion-heading">
            <Accordion.Trigger className="MyAccordion-trigger">Trigger 3</Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 3, the value is &quot;three&quot;
          </Accordion.Panel>
        </Accordion.Section>
      </Accordion.Root>

      <hr style={{ marginTop: 32, marginBottom: 32 }} role="presentation" />

      <h2>Controlled, at least one section must remain open</h2>

      <Accordion.Root
        className="MyAccordion-root"
        value={val2}
        onOpenChange={(newValue: Accordion.Root.Props['Value']) => {
          // console.log(newValue);
          if (newValue.length > 0) {
            setVal2(newValue);
          }
        }}
        aria-label="Controlled Accordion, one section must remain open"
        openMultiple={openMultiple}
      >
        <Accordion.Section className="MyAccordion-section" value="one">
          <Accordion.Heading className="MyAccordion-heading">
            <Accordion.Trigger className="MyAccordion-trigger">Trigger 1</Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 1, the value is &quot;one&quot;
          </Accordion.Panel>
        </Accordion.Section>

        <Accordion.Section className="MyAccordion-section" value="two">
          <Accordion.Heading className="MyAccordion-heading">
            <Accordion.Trigger className="MyAccordion-trigger">Trigger 2</Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 2, the value is &quot;two&quot;
          </Accordion.Panel>
        </Accordion.Section>

        <Accordion.Section className="MyAccordion-section" value="three">
          <Accordion.Heading className="MyAccordion-heading">
            <Accordion.Trigger className="MyAccordion-trigger">Trigger 3</Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel className="MyAccordion-panel">
            This is the contents of Accordion.Panel 3, the value is &quot;three&quot;
          </Accordion.Panel>
        </Accordion.Section>
      </Accordion.Root>
      <Styles />
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
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor" />
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

const grey = {
  100: '#E5EAF2',
  300: '#C7D0DD',
  500: '#9DA8B7',
  600: '#6B7A90',
  800: '#303740',
  900: '#1C2025',
};

// function useIsDarkMode() {
//   const theme = useTheme();
//   return theme.palette.mode === 'dark';
// }

function Styles() {
  // Replace this with your app logic for determining dark mode
  // const isDarkMode = useIsDarkMode();
  return (
    <style>
      {`
        .Checkbox {
          all: unset;
          box-sizing: border-box;
          text-align: center;
          width: 20px;
          height: 20px;
          padding: 0;
          border-radius: 4px;
          border: 2px solid ${grey[600]};
          background: none;
          transition-property: background, border-color;
          transition-duration: 0.15s;
        }

        .Checkbox[data-disabled] {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .Checkbox:focus-visible {
          outline: 2px solid ${/* isDarkMode ? grey[600] : */ grey[500]};
          outline-offset: 2px;
        }

        .Checkbox[data-state="checked"] {
          border-color: ${grey[800]};
          background: ${grey[800]};
        }

        .Checkbox-indicator {
          height: 100%;
          display: inline-block;
          visibility: hidden;
          color: ${/* isDarkMode ? grey[900] : */ grey[300]};
        }

        .Checkbox-indicator[data-state="checked"] {
          visibility: visible;
        }

        .Checkbox-icon {
          width: 100%;
          height: 100%;
        }
      `}
    </style>
  );
}

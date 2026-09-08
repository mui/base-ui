import * as React from 'react';
import { Accordion } from '@base-ui/react';
import './Accordion.css';

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="round"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M1.5 8h13M8 14.5v-13" />
    </svg>
  );
}

export const Basic = () => (
  <Accordion.Root className="Accordion">
    <Accordion.Item className="Item">
      <Accordion.Header className="Header">
        <Accordion.Trigger className="Trigger">
          What is Base UI?
          <PlusIcon className="Icon" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className="Panel">
        <div className="Content">
          Base UI is a library of high-quality unstyled React components for design systems and
          web apps.
        </div>
      </Accordion.Panel>
    </Accordion.Item>

    <Accordion.Item className="Item">
      <Accordion.Header className="Header">
        <Accordion.Trigger className="Trigger">
          How do I get started?
          <PlusIcon className="Icon" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className="Panel">
        <div className="Content">
          Head to the "Quick start" guide in the docs. If you've used unstyled libraries before,
          you'll feel at home.
        </div>
      </Accordion.Panel>
    </Accordion.Item>

    <Accordion.Item className="Item">
      <Accordion.Header className="Header">
        <Accordion.Trigger className="Trigger">
          Can I use it for my project?
          <PlusIcon className="Icon" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className="Panel">
        <div className="Content">Of course! Base UI is free and open source.</div>
      </Accordion.Panel>
    </Accordion.Item>
  </Accordion.Root>
);

export const MultipleOpen = () => (
  <Accordion.Root className="Accordion" defaultValue={['a', 'b']} multiple>
    <Accordion.Item className="Item" value="a">
      <Accordion.Header className="Header">
        <Accordion.Trigger className="Trigger">
          Section one
          <PlusIcon className="Icon" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className="Panel">
        <div className="Content">Both sections can be open at the same time.</div>
      </Accordion.Panel>
    </Accordion.Item>
    <Accordion.Item className="Item" value="b">
      <Accordion.Header className="Header">
        <Accordion.Trigger className="Trigger">
          Section two
          <PlusIcon className="Icon" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className="Panel">
        <div className="Content">This is the second, independently toggled panel.</div>
      </Accordion.Panel>
    </Accordion.Item>
  </Accordion.Root>
);

export const DisabledItem = () => (
  <Accordion.Root className="Accordion" defaultValue={['a']}>
    <Accordion.Item className="Item" value="a">
      <Accordion.Header className="Header">
        <Accordion.Trigger className="Trigger">
          Available section
          <PlusIcon className="Icon" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className="Panel">
        <div className="Content">This section can be toggled normally.</div>
      </Accordion.Panel>
    </Accordion.Item>
    <Accordion.Item className="Item" value="b" disabled>
      <Accordion.Header className="Header">
        <Accordion.Trigger className="Trigger">
          Disabled section
          <PlusIcon className="Icon" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className="Panel">
        <div className="Content">This section cannot be toggled.</div>
      </Accordion.Panel>
    </Accordion.Item>
  </Accordion.Root>
);

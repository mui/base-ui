import * as React from 'react';
import { Collapsible } from '@base-ui/react';
import './Collapsible.css';

function CaretRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M6 12V4l4.5 4z" />
    </svg>
  );
}

export const Open = () => (
  <Collapsible.Root className="Collapsible" defaultOpen>
    <Collapsible.Trigger className="Trigger">
      Recovery keys
      <CaretRightIcon className="Icon" />
    </Collapsible.Trigger>
    <Collapsible.Panel className="Panel" keepMounted>
      <div className="Content">
        <div>alien-bean-pasta</div>
        <div>wild-irish-burrito</div>
        <div>horse-battery-staple</div>
      </div>
    </Collapsible.Panel>
  </Collapsible.Root>
);

export const Closed = () => (
  <Collapsible.Root className="Collapsible">
    <Collapsible.Trigger className="Trigger">
      Recovery keys
      <CaretRightIcon className="Icon" />
    </Collapsible.Trigger>
    <Collapsible.Panel className="Panel" keepMounted>
      <div className="Content">
        <div>alien-bean-pasta</div>
        <div>wild-irish-burrito</div>
        <div>horse-battery-staple</div>
      </div>
    </Collapsible.Panel>
  </Collapsible.Root>
);

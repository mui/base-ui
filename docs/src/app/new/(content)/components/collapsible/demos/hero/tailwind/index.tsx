import * as React from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';

export default function ExampleCollapsible() {
  return (
    <Collapsible.Root className="flex w-48 flex-col gap-2" render={<div />}>
      <Collapsible.Trigger className="flex items-center justify-between">
        Resources
      </Collapsible.Trigger>
      <Collapsible.Panel className="flex flex-col gap-2">
        <a href="https://github.com/mui/base-ui/" rel="noreferrer">
          GitHub
        </a>
        <a
          href="https://www.npmjs.com/package/@base-ui-components/react"
          rel="noreferrer"
        >
          npm package
        </a>
        <a href="https://x.com/base_ui" rel="noreferrer">
          @base_ui
        </a>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentcolor" {...props}>
      <path d="M6.75 0H5.25V5.25H0V6.75L5.25 6.75V12H6.75V6.75L12 6.75V5.25H6.75V0Z" />
    </svg>
  );
}

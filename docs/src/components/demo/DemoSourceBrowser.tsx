import * as React from 'react';
import * as BaseDemo from 'docs/src/blocks/Demo';
import { Collapsible } from '@base-ui-components/react/collapsible';

interface DemoSourceBrowserProps {
  collapsibleOpen: boolean;

  /** How many lines should the code block have to get collapsed instead of rendering fully */
  collapsibleLinesThreshold: number;
}

export function DemoSourceBrowser({
  collapsibleOpen,
  collapsibleLinesThreshold = 12,
}: DemoSourceBrowserProps) {
  const demoContext = React.useContext(BaseDemo.DemoContext);

  if (!demoContext) {
    throw new Error('Demo.Playground must be used within a Demo.Root');
  }

  const { selectedFile } = demoContext;
  const lineBreaks = selectedFile.content.match(/\n/g) ?? [];

  if (lineBreaks.length < collapsibleLinesThreshold) {
    return <DemoCodeBlock data-open />;
  }

  return (
    // The trigger has to appear before the panel in the DOM in order
    // for the screen reader cursor navigation to make sense.
    <div className="flex flex-col-reverse">
      <Collapsible.Trigger className="DemoCollapseButton">
        {collapsibleOpen ? 'Hide' : 'Show'} code
      </Collapsible.Trigger>
      <Collapsible.Panel
        keepMounted
        hidden={false}
        aria-hidden={!collapsibleOpen}
        render={<DemoCodeBlock />}
      />
    </div>
  );
}

function DemoCodeBlock(props: React.ComponentProps<typeof BaseDemo.SourceBrowser>) {
  return (
    <BaseDemo.SourceBrowser
      {...props}
      className="DemoCodeBlockContainer"
      // Select code block contents on Ctrl/Cmd + A
      tabIndex={-1}
      onKeyDown={(event) => {
        if (
          event.key === 'a' &&
          (event.metaKey || event.ctrlKey) &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          window.getSelection()?.selectAllChildren(event.currentTarget);
        }
      }}
    />
  );
}

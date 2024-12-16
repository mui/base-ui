import * as React from 'react';
import * as BaseDemo from 'docs/src/blocks/Demo';
import { Collapsible } from '@base-ui-components/react/collapsible';
import * as ScrollArea from '../ScrollArea';

interface DemoSourceBrowserProps {
  collapsibleOpen: boolean;

  /** How many lines should the code block have to get collapsed instead of rendering fully */
  collapsibleLinesThreshold?: number;
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
    return (
      <DemoCodeBlockContainer>
        <ScrollArea.Viewport
          style={{ overflow: undefined }}
          render={({ children, ...props }) => {
            return <BaseDemo.SourceBrowser {...props} />;
          }}
        />
        <ScrollArea.Scrollbar orientation="horizontal" />
      </DemoCodeBlockContainer>
    );
  }

  return (
    // The trigger has to appear before the panel in the DOM in order
    // for the screen reader cursor navigation to make sense.
    <div className="flex flex-col-reverse">
      <Collapsible.Trigger className="DemoCollapseButton">
        {collapsibleOpen ? 'Hide' : 'Show'} code
      </Collapsible.Trigger>
      <Collapsible.Panel keepMounted hidden={false} render={<DemoCodeBlockContainer />}>
        <ScrollArea.Viewport
          style={{ overflow: undefined }}
          render={({ children, ...props }) => {
            return <BaseDemo.SourceBrowser aria-hidden={!collapsibleOpen} {...props} />;
          }}
        />
        <ScrollArea.Scrollbar orientation="horizontal" />
      </Collapsible.Panel>
    </div>
  );
}

function DemoCodeBlockContainer(props: React.ComponentProps<typeof ScrollArea.Root>) {
  return (
    <ScrollArea.Root
      {...props}
      className="DemoCodeBlockContainer"
      tabIndex={-1}
      onKeyDown={handleSelectAll}
    />
  );
}

function handleSelectAll(event: React.KeyboardEvent) {
  if (event.key === 'a' && (event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    window.getSelection()?.selectAllChildren(event.currentTarget);
  }
}

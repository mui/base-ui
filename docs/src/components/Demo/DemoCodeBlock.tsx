import * as React from 'react';
import { Collapsible } from '@base-ui/react/collapsible';
import * as ScrollArea from '../ScrollArea';

interface DemoCodeBlockProps {
  selectedFile: React.ReactNode;
  selectedFileName: string | undefined;
  selectedFileLines: number;
  collapsibleOpen: boolean;
  /** How many lines should the code block have to get collapsed instead of rendering fully */
  collapsibleLinesThreshold?: number;
  collapsibleTriggerRef: React.Ref<HTMLButtonElement>;
  copyButton: React.ReactNode;
}

function Root(props: React.ComponentProps<typeof ScrollArea.Root>) {
  return (
    <ScrollArea.Root
      {...props}
      className="DemoCodeBlockRoot"
      tabIndex={-1}
      onKeyDown={(event: React.KeyboardEvent) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          String.fromCharCode(event.keyCode) === 'A' &&
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

export function DemoCodeBlock({
  selectedFile,
  selectedFileLines,
  collapsibleOpen,
  collapsibleLinesThreshold = 12,
  collapsibleTriggerRef,
  copyButton,
}: DemoCodeBlockProps) {
  if (selectedFileLines < collapsibleLinesThreshold) {
    return (
      <Root>
        <ScrollArea.Viewport>
          <div className="DemoSourceBrowser">
            {copyButton}
            {selectedFile}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Corner />
        <ScrollArea.Scrollbar orientation="vertical" />
        <ScrollArea.Scrollbar orientation="horizontal" />
      </Root>
    );
  }

  return (
    <div className="DemoCodeBlockCollapsible" data-open={collapsibleOpen ? '' : undefined}>
      <Root data-closed={collapsibleOpen ? undefined : ''}>
        <Collapsible.Panel
          keepMounted
          hidden={false}
          render={
            <ScrollArea.Viewport
              aria-hidden={!collapsibleOpen}
              data-closed={collapsibleOpen ? undefined : ''}
              className="DemoCodeBlockViewport"
              {...(!collapsibleOpen && { tabIndex: undefined, style: { overflow: undefined } })}
            />
          }
        >
          <div className="DemoSourceBrowser">
            {copyButton}
            {selectedFile}
          </div>
        </Collapsible.Panel>

        <Collapsible.Trigger
          ref={collapsibleTriggerRef}
          className="DemoCollapseButton"
          data-sticky={collapsibleOpen ? '' : undefined}
        >
          <span>{collapsibleOpen ? 'Hide' : 'Show'} code</span>
        </Collapsible.Trigger>

        {collapsibleOpen && (
          <React.Fragment>
            <ScrollArea.Corner />
            <ScrollArea.Scrollbar orientation="vertical" />
            <ScrollArea.Scrollbar orientation="horizontal" />
          </React.Fragment>
        )}
      </Root>
    </div>
  );
}

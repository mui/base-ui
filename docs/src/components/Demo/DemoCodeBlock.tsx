import * as React from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';
import * as ScrollArea from '../ScrollArea';

import '@wooorm/starry-night/style/both';

interface DemoCodeBlockProps {
  selectedFile: React.ReactNode;
  collapsibleOpen: boolean;
  /** How many lines should the code block have to get collapsed instead of rendering fully */
  collapsibleLinesThreshold?: number;
  /** When compact, we don't show a preview of the collapse code */
  compact: boolean;
}

function Root(props: React.ComponentProps<typeof ScrollArea.Root>) {
  return (
    <ScrollArea.Root
      {...props}
      className="DemoCodeBlockRoot"
      tabIndex={-1}
      onKeyDown={(event: React.KeyboardEvent) => {
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

export function DemoCodeBlock({
  selectedFile,
  compact,
  collapsibleOpen,
  // collapsibleLinesThreshold = 12,
}: DemoCodeBlockProps) {
  // const lineBreaks = selectedFile.content.match(/\n/g) ?? [];

  // if (lineBreaks.length < collapsibleLinesThreshold) {
  //   return (
  //     <Root>
  //       <ScrollArea.Viewport>
  //         <BaseDemo.SourceBrowser className="DemoSourceBrowser" />
  //       </ScrollArea.Viewport>
  //       <ScrollArea.Corner />
  //       <ScrollArea.Scrollbar orientation="vertical" />
  //       <ScrollArea.Scrollbar orientation="horizontal" />
  //     </Root>
  //   );
  // }

  return (
    <React.Fragment>
      <Root
        render={
          <Collapsible.Panel
            keepMounted={compact ? undefined : true}
            hidden={compact ? undefined : false}
          />
        }
      >
        <ScrollArea.Viewport
          aria-hidden={!collapsibleOpen}
          data-closed={collapsibleOpen ? undefined : ''}
          className="DemoCodeBlockViewport"
          {...(!collapsibleOpen && { tabIndex: undefined, style: { overflow: undefined } })}
        >
          <pre className="DemoSourceBrowser" data-language={'TODO'}>
            {selectedFile}
          </pre>
        </ScrollArea.Viewport>

        {collapsibleOpen && (
          <React.Fragment>
            <ScrollArea.Corner />
            <ScrollArea.Scrollbar orientation="vertical" />
            <ScrollArea.Scrollbar orientation="horizontal" />
          </React.Fragment>
        )}
      </Root>

      <Collapsible.Trigger className="DemoCollapseButton">
        {collapsibleOpen ? 'Hide' : 'Show'} code
      </Collapsible.Trigger>
    </React.Fragment>
  );
}

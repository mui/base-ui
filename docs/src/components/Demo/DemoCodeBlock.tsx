import * as React from 'react';
import { Collapsible } from '@base-ui-components/react/collapsible';
import * as ScrollArea from '../ScrollArea';

import './CodeHighlighting.css';

function fileNameToLanguage(fileName: string | undefined) {
  if (!fileName) {
    return 'text';
  }
  if (fileName.endsWith('.tsx') || fileName.endsWith('.ts')) {
    return 'tsx';
  }
  if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) {
    return 'jsx';
  }
  if (fileName.endsWith('.json')) {
    return 'json';
  }
  if (fileName.endsWith('.html')) {
    return 'html';
  }
  if (fileName.endsWith('.css')) {
    return 'css';
  }
  if (fileName.endsWith('.mdx')) {
    return 'mdx';
  }
  return 'text';
}

interface DemoCodeBlockProps {
  selectedFile: React.ReactNode;
  selectedFileName: string | undefined;
  selectedFileLines: number;
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
  selectedFileName,
  selectedFileLines,
  compact,
  collapsibleOpen,
  collapsibleLinesThreshold = 12,
}: DemoCodeBlockProps) {
  if (selectedFileLines < collapsibleLinesThreshold) {
    return (
      <Root>
        <ScrollArea.Viewport>
          <pre className="DemoSourceBrowser" data-language={fileNameToLanguage(selectedFileName)}>
            {selectedFile}
          </pre>
        </ScrollArea.Viewport>
        <ScrollArea.Corner />
        <ScrollArea.Scrollbar orientation="vertical" />
        <ScrollArea.Scrollbar orientation="horizontal" />
      </Root>
    );
  }

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
          <pre className="DemoSourceBrowser" data-language={fileNameToLanguage(selectedFileName)}>
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

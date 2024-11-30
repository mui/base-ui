'use client';
import * as React from 'react';
import { DemoContext } from './DemoContext';

export const DemoSourceBrowser = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  (props, forwardedRef) => {
    const demoContext = React.useContext(DemoContext);
    if (!demoContext) {
      throw new Error('Demo.Playground must be used within a Demo.Root');
    }

    const { selectedFile } = demoContext;

    if (selectedFile.prettyContent != null) {
      // Remove tabindex="0" that the syntax highlighter adds
      selectedFile.prettyContent = selectedFile.prettyContent.replace('tabindex="0"', '');
      return (
        <div
          {...props}
          ref={forwardedRef}
          data-language={selectedFile.type}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: selectedFile.prettyContent }}
        />
      );
    }

    return (
      <div {...props} ref={forwardedRef}>
        <pre>{selectedFile.content}</pre>
      </div>
    );
  },
);

export namespace DemoSourceBrowser {}

'use client';
import * as React from 'react';
import clsx from 'clsx';
import { camelCase } from 'es-toolkit/string';
import { DemoContext } from './DemoContext';

export const DemoSourceBrowser = React.forwardRef<HTMLPreElement, React.ComponentProps<'pre'>>(
  (props, forwardedRef) => {
    const demoContext = React.useContext(DemoContext);
    if (!demoContext) {
      throw new Error('Demo.Playground must be used within a Demo.Root');
    }

    const { selectedFile } = demoContext;

    if (selectedFile.prettyContent != null) {
      // Unwrap the incoming `<pre>` and parse out its attributes to put on the node we own
      const [, pre, code] = selectedFile.prettyContent.match(/(<pre.+?>)(.+)<\/pre>/s) ?? [];

      if (!pre || !code) {
        throw new Error('Couldn’t parse prettyContent');
      }

      const [, className = ''] = pre.match(/class="(.+?)"/) ?? [];
      const [, styleAttr = ''] = pre.match(/style="(.+?)"/) ?? [];
      const style = Object.fromEntries(
        styleAttr
          .split(';')
          .map((str) => str.split(':'))
          .map(([key, value]) => [camelCase(key), value]),
      );

      return (
        <pre
          {...props}
          ref={forwardedRef}
          data-language={selectedFile.type}
          className={clsx(className, props.className)}
          style={{ ...style, ...props.style }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: code }}
        />
      );
    }

    return (
      <pre ref={forwardedRef}>
        <code>{selectedFile.content}</code>
      </pre>
    );
  },
);

export namespace DemoSourceBrowser {}

import * as React from 'react';
import type { MDXComponents } from 'mdx/types';
import { DemoLoader } from './components/demo/NewDemoLoader';
import * as CodeBlock from './components/CodeBlock';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    figure: (props) => {
      if ('data-rehype-pretty-code-figure' in props) {
        return <CodeBlock.Root className="my-5" {...props} />;
      }

      return <figure {...props} />;
    },
    figcaption: (props) => {
      if ('data-rehype-pretty-code-title' in props) {
        return <CodeBlock.Panel {...props} />;
      }

      return <figcaption {...props} />;
    },
    pre: CodeBlock.Pre,
    Demo: (props) => <DemoLoader className="my-5" {...props} />,
    ...components,
  };
}

import * as React from 'react';
import { DemoLoader } from './components/demo/NewDemoLoader';
import * as CodeBlock from './components/CodeBlock';
import * as Table from './components/Table';
import * as QuickNav from './components/quick-nav/QuickNav';
import { ApiTable } from './components/ApiTable';
import { Code } from './components/Code';

interface MDXComponents {
  [key: string]: React.FC<any> | MDXComponents;
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    code: (props) => ('data-theme' in props ? <code {...props} /> : <Code {...props} />),
    h1: (props) => <h1 className="mb-4 text-3xl font-bold" {...props} />,
    h2: (props) => (
      <div className="mt-10 mb-6">
        <h2 className="mb-4 scroll-mt-6 text-xl font-medium" {...props} />
        <div className="border-border border-t" />
      </div>
    ),
    h3: (props) => <h3 className="mt-8 mb-2 scroll-mt-6 text-lg font-medium" {...props} />,
    h4: (props) => <h4 className="mt-8 mb-2 scroll-mt-6 text-lg font-medium" {...props} />,
    h5: (props) => <h5 className="mt-8 mb-2 scroll-mt-6 text-lg font-medium" {...props} />,
    h6: (props) => <h6 className="mt-8 mb-2 scroll-mt-6 text-lg font-medium" {...props} />,
    p: (props) => <p className="mb-4" {...props} />,
    figure: (props) => {
      if ('data-rehype-pretty-code-figure' in props) {
        return <CodeBlock.Root className="mt-5 mb-8" {...props} />;
      }

      return <figure {...props} />;
    },
    figcaption: (props) => {
      if ('data-rehype-pretty-code-title' in props) {
        return <CodeBlock.Panel {...props} />;
      }

      return <figcaption {...props} />;
    },
    // Don't pass the tabindex prop from shiki, most browsers
    // now handle scroll containers focus out of the box
    pre: ({ tabIndex, ...props }) => <CodeBlock.Pre {...props} />,
    table: (props) => <Table.Root className="my-5" {...props} />,
    thead: Table.Head,
    tbody: Table.Body,
    tr: Table.Row,
    th: Table.HeaderCell,
    td: Table.Cell,

    // Custom components
    ApiTable,
    Demo: (props) => <DemoLoader className="mt-5 mb-8" {...props} />,
    QuickNav,
    Subtitle: (props) => <p className="text-gray -mt-2 mb-5 text-lg" {...props} />,
    ...components,
  };
}

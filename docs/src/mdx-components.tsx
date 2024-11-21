import * as React from 'react';
import { DemoLoader } from './components/demo/NewDemoLoader';
import * as CodeBlock from './components/CodeBlock';
import * as Table from './components/Table';
import * as QuickNav from './components/quick-nav/QuickNav';
import { Code } from './components/Code';
import { PropsTable } from './components/reference/PropsTable';
import { AttributesTable } from './components/reference/AttributesTable';
import { CssVariablesTable } from './components/reference/CssVariablesTable';
import { TableCode } from './components/TableCode';

interface MDXComponents {
  [key: string]: React.FC<any> | MDXComponents;
}

export const mdxComponents: MDXComponents = {
  code: Code,
  h1: (props) => <h1 className="mb-4 text-3xl font-bold" {...props} />,
  h2: (props) => (
    <div className="mt-10 mb-5">
      <h2 className="mb-4 scroll-mt-6 text-xl font-medium" {...props} />
      <div className="border-t border-gray-200" />
    </div>
  ),
  h3: (props) => <h3 className="mt-8 mb-1.5 scroll-mt-6 text-lg font-medium" {...props} />,
  h4: (props) => <h4 className="mt-8 mb-1.5 scroll-mt-6 font-medium" {...props} />,
  h5: (props) => <h5 className="mt-8 mb-1.5 scroll-mt-6 font-medium" {...props} />,
  h6: (props) => <h6 className="mt-8 mb-1.5 scroll-mt-6 font-medium" {...props} />,
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
  Demo: (props) => <DemoLoader className="mt-5 mb-8" {...props} />,
  QuickNav,
  AttributesTable: (props) => <AttributesTable className="mt-5 mb-6" {...props} />,
  CssVariablesTable: (props) => <CssVariablesTable className="mt-5 mb-6" {...props} />,
  PropsTable: (props) => <PropsTable className="mt-5 mb-6" {...props} />,
  Subtitle: (props) => <p className="text-gray -mt-2 mb-5 text-lg" {...props} />,
};

export const inlineMdxComponents: MDXComponents = {
  ...mdxComponents,
  // eslint-disable-next-line react/jsx-no-useless-fragment
  p: (props) => <React.Fragment {...props} />,
};

export const tableMdxComponents: MDXComponents = {
  ...mdxComponents,
  // eslint-disable-next-line react/jsx-no-useless-fragment
  p: (props) => <React.Fragment {...props} />,
  code: TableCode,
};

export function useMDXComponents(): MDXComponents {
  return mdxComponents;
}

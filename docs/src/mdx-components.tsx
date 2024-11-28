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
import { getChildrenText } from './getChildrenText';

interface MDXComponents {
  [key: string]: React.FC<any> | MDXComponents;
}

export const mdxComponents: MDXComponents = {
  code: (props) => <Code className="mx-[0.1em]" {...props} />,
  h1: (props) => (
    <React.Fragment>
      <h1 className="mb-4 text-3xl font-bold text-balance" {...props} />
      <title>{`${getChildrenText(props.children)} · Base UI`}</title>
    </React.Fragment>
  ),
  h2: (props) => (
    <div className="mt-10 mb-5">
      <h2 className="mb-4 scroll-mt-6 text-xl font-medium text-balance" {...props} />
      <div className="border-t border-gray-200" />
    </div>
  ),
  h3: (props) => (
    <h3 className="mt-8 mb-1.5 scroll-mt-6 text-lg font-medium text-balance" {...props} />
  ),
  h4: (props) => <h4 className="mt-8 mb-1.5 scroll-mt-6 font-medium text-balance" {...props} />,
  h5: (props) => <h5 className="mt-8 mb-1.5 scroll-mt-6 font-medium text-balance" {...props} />,
  h6: (props) => <h6 className="mt-8 mb-1.5 scroll-mt-6 font-medium text-balance" {...props} />,
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
  th: (props: React.ComponentProps<'th'>) =>
    props.scope === 'row' ? <Table.RowHeader {...props} /> : <Table.ColumnHeader {...props} />,
  td: Table.Cell,

  // Custom components
  Demo: (props) => <DemoLoader className="mt-5 mb-8" {...props} />,
  QuickNav,
  AttributesTable: (props) => <AttributesTable className="mt-5 mb-6" {...props} />,
  CssVariablesTable: (props) => <CssVariablesTable className="mt-5 mb-6" {...props} />,
  Meta: (props: React.ComponentProps<'meta'>) => {
    if (props.name === 'description' && String(props.content).length > 170) {
      throw new Error('Meta description shouldn’t be longer than 170 chars');
    }
    return <meta {...props} />;
  },
  PropsTable: (props) => <PropsTable className="mt-5 mb-6" {...props} />,
  Subtitle: (props) => <p className="-mt-2 mb-5 text-lg text-balance text-gray" {...props} />,
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

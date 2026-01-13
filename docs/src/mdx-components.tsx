import * as React from 'react';
import * as CodeBlock from './components/CodeBlock';
import * as Table from './components/Table';
import * as QuickNav from './components/QuickNav/QuickNav';
import { Code } from './components/Code';
import { ReferenceAccordion } from './components/ReferenceTable/ReferenceAccordion';
import { ParametersReferenceTable } from './components/ReferenceTable/ParametersReferenceTable';
import { ReturnValueReferenceTable } from './components/ReferenceTable/ReturnValueReferenceTable';
import { AttributesReferenceTable } from './components/ReferenceTable/AttributesReferenceTable';
import { CssVariablesReferenceTable } from './components/ReferenceTable/CssVariablesReferenceTable';
import { Link } from './components/Link';
import { HeadingLink } from './components/HeadingLink';
import { Subtitle } from './components/Subtitle/Subtitle';
import { Kbd } from './components/Kbd/Kbd';

interface MDXComponents {
  [key: string]: React.FC<any> | MDXComponents;
}

// Maintain spacing between MDX components here
export const mdxComponents: MDXComponents = {
  a: Link,
  code: (props) => <Code className="data-[inline]:mx-[0.1em]" {...props} />,
  h1: (props) => (
    // Do not wrap heading tags in divs, that confuses Safari Reader
    <h1 className="mb-4 text-3xl font-bold text-balance" {...props} />
  ),
  h2: ({ children, id, ...otherProps }) => {
    return (
      <h2
        className="mt-10 mb-4 scroll-mt-18 text-xl font-medium text-balance show-side-nav:scroll-mt-6"
        id={id}
        {...otherProps}
      >
        <HeadingLink id={id}>{children}</HeadingLink>
      </h2>
    );
  },
  h3: ({ children, id, ...otherProps }) => {
    return (
      <h3
        className="mt-8 mb-1.5 scroll-mt-18 text-lg font-medium text-balance show-side-nav:scroll-mt-6"
        id={id}
        {...otherProps}
      >
        <HeadingLink id={id}>{children}</HeadingLink>
      </h3>
    );
  },
  h4: (props) => <h4 className="mt-8 mb-1.5 scroll-mt-6 font-medium text-balance" {...props} />,
  h5: (props) => <h5 className="mt-8 mb-1.5 scroll-mt-6 font-medium text-balance" {...props} />,
  h6: (props) => <h6 className="mt-8 mb-1.5 scroll-mt-6 font-medium text-balance" {...props} />,
  p: (props) => <p className="mb-4" {...props} />,
  li: (props) => <li className="mb-0.5 [&>p]:mb-2" {...props} />,
  ul: (props) => <ul className="mb-4 ml-4.5 list-disc" {...props} />,
  ol: (props) => <ol className="mb-4 ml-7 list-decimal" {...props} />,
  kbd: Kbd,
  strong: (props) => <strong className="font-medium" {...props} />,
  figure: (props) => {
    if ('data-rehype-pretty-code-figure' in props) {
      return <CodeBlock.Root {...props} />;
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
  QuickNav,
  Meta: (props: React.ComponentProps<'meta'>) => {
    if (props.name === 'description' && String(props.content).length > 170) {
      throw new Error('Meta description shouldn’t be longer than 170 chars');
    }
    return <meta {...props} />;
  },
  Subtitle: (props) => <Subtitle className="-mt-2 mb-5" {...props} />,

  // API reference components
  AttributesReferenceTable: (props) => (
    <AttributesReferenceTable className="mt-5 mb-6" {...props} />
  ),
  CssVariablesReferenceTable: (props) => (
    <CssVariablesReferenceTable className="mt-5 mb-6" {...props} />
  ),
  PropsReferenceTable: (props) => <ReferenceAccordion className="mt-5 mb-6" {...props} />,
  ParametersReferenceTable: (props) => (
    <ParametersReferenceTable className="mt-5 mb-6" {...props} />
  ),
  ReturnValueReferenceTable: (props) => (
    <ReturnValueReferenceTable className="mt-5 mb-6" {...props} />
  ),
};

export const inlineMdxComponents: MDXComponents = {
  ...mdxComponents,
  p: (props) => props.children,
};

export function useMDXComponents(): MDXComponents {
  return mdxComponents;
}

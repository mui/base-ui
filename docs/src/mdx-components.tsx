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
import './css/mdx-components.css';

interface MDXComponents {
  [key: string]: React.FC<any> | MDXComponents;
}

// Maintain spacing between MDX components here
export const mdxComponents: MDXComponents = {
  a: Link,
  code: (props) => <Code className="MdInlineCode" {...props} />,
  h1: (props) => (
    // Do not wrap heading tags in divs, that confuses Safari Reader
    <h1 className="MdH1" {...props} />
  ),
  h2: ({ children, id, ...otherProps }) => {
    return (
      <h2 className="MdH2" id={id} {...otherProps}>
        <HeadingLink id={id}>{children}</HeadingLink>
      </h2>
    );
  },
  h3: ({ children, id, ...otherProps }) => {
    return (
      <h3 className="MdH3" id={id} {...otherProps}>
        <HeadingLink id={id}>{children}</HeadingLink>
      </h3>
    );
  },
  h4: (props) => <h4 className="MdH4" {...props} />,
  h5: (props) => <h5 className="MdH5" {...props} />,
  h6: (props) => <h6 className="MdH6" {...props} />,
  p: (props) => <p className="MdP" {...props} />,
  li: (props) => <li className="MdListItem" {...props} />,
  ul: (props) => <ul className="MdUl" {...props} />,
  ol: (props) => <ol className="MdOl" {...props} />,
  kbd: Kbd,
  strong: (props) => <strong className="MdStrong" {...props} />,
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
  table: (props) => <Table.Root className="MdTable" {...props} />,
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
  Subtitle: (props) => <Subtitle className="MdSubtitle" {...props} />,

  // API reference components
  AttributesReferenceTable: (props) => (
    <AttributesReferenceTable className="MdReferenceBlock" {...props} />
  ),
  CssVariablesReferenceTable: (props) => (
    <CssVariablesReferenceTable className="MdReferenceBlock" {...props} />
  ),
  PropsReferenceTable: (props) => <ReferenceAccordion className="MdReferenceBlock" {...props} />,
  ParametersReferenceTable: (props) => (
    <ParametersReferenceTable className="MdReferenceBlock" {...props} />
  ),
  ReturnValueReferenceTable: (props) => (
    <ReturnValueReferenceTable className="MdReferenceBlock" {...props} />
  ),
};

export const inlineMdxComponents: MDXComponents = {
  ...mdxComponents,
  p: (props) => props.children,
};

export function useMDXComponents(): MDXComponents {
  return mdxComponents;
}

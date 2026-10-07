import * as React from 'react';
import clsx from 'clsx';
import * as CodeBlock from './components/CodeBlock';
import * as Table from './components/Table';
import * as QuickNav from './components/QuickNav/QuickNav';
import { Code } from './components/Code';
import { Link } from './components/Link';
import { HeadingLink } from './components/HeadingLink';
import { Subtitle } from './components/Subtitle/Subtitle';
import { TypeRef } from './components/TypeRef';
import { TypePropRef } from './components/TypePropRef';
import { Kbd } from './components/Kbd/Kbd';
import { CodeBlockPreComputed } from './components/CodeBlock/CodeBlockPreComputed';
import './css/mdx-components.css';

interface MDXComponents {
  [key: string]: React.FC<any> | MDXComponents;
}

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

function HeadingBadge({ children }: { children: React.ReactNode }) {
  return <span className="MdHeadingBadge">{children}</span>;
}

function Heading({
  as: Tag,
  className,
  children,
  id,
  link = false,
  'data-heading-badge': headingBadge,
  ...otherProps
}: React.ComponentProps<HeadingLevel> & {
  as: HeadingLevel;
  link?: boolean;
  'data-heading-badge'?: string;
}) {
  const badge = headingBadge ? <HeadingBadge>{headingBadge}</HeadingBadge> : null;

  return (
    <Tag className={className} id={id} {...otherProps}>
      {link ? (
        <HeadingLink id={id}>
          {children}
          {badge}
        </HeadingLink>
      ) : (
        <React.Fragment>
          {children}
          {badge}
        </React.Fragment>
      )}
    </Tag>
  );
}

// Maintain spacing between MDX components here
export const mdxComponentsCommon: MDXComponents = {
  a: Link,
  code: (props) => <Code {...props} className={clsx('MdCode', props.className)} />,
  em: (props) => <em className="MdEm" {...props} />,
  h1: (props) => (
    // Do not wrap heading tags in divs, that confuses Safari Reader
    <Heading as="h1" className="MdH1" {...props} />
  ),
  h2: (props) => <Heading as="h2" className="MdH2" link {...props} />,
  h3: (props) => <Heading as="h3" className="MdH3" link {...props} />,
  h4: (props) => <Heading as="h4" className="MdH4" {...props} />,
  h5: (props) => <Heading as="h5" className="MdH5" {...props} />,
  h6: (props) => <Heading as="h6" className="MdH6" {...props} />,
  p: (props) => <p className="MdP" {...props} />,
  li: (props) => <li className="MdListItem" {...props} />,
  ul: (props) => <ul className="MdUl" {...props} />,
  ol: (props) => <ol className="MdOl" {...props} />,
  kbd: Kbd,
  figure: (props) => <figure className="MdFigure" {...props} />,
  hr: (props) => <hr className="MdHr" {...props} />,
  // Custom components
  Meta: (props: React.ComponentProps<'meta'>) => {
    if (props.name === 'description' && String(props.content).length > 170) {
      throw new Error("Meta description shouldn't be longer than 170 chars");
    }
    // At build time, `transformMarkdownMetadata` extracts <Meta> attributes
    // and injects them as `export const metadata = { ... }` into the compiled
    // MDX. Next.js picks that export up and emits the <meta> tag itself, so
    // rendering one here would produce a duplicate.
    return null;
  },
};

export const mdxComponents: MDXComponents = {
  ...mdxComponentsCommon,
  pre: ({ tabIndex, ...props }) => {
    if ('data-precompute' in props) {
      return (
        <CodeBlock.Root className="MdFigure">
          <CodeBlockPreComputed {...props} />
        </CodeBlock.Root>
      );
    }

    return <CodeBlock.Pre {...props} />;
  },
  table: (props) => <Table.Root className="MdTable" {...props} />,
  thead: Table.Head,
  tbody: Table.Body,
  tr: Table.Row,
  th: (props: React.ComponentProps<'th'>) =>
    props.scope === 'row' ? <Table.RowHeader {...props} /> : <Table.ColumnHeader {...props} />,
  td: Table.Cell,
  // Custom components
  TypeRef,
  TypePropRef,
  QuickNav,
  Subtitle: (props) => <Subtitle {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return mdxComponents;
}

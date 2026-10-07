import * as React from 'react';
import { mdxComponentsCommon } from 'docs/src/mdx-components';
import * as CodeBlock from 'docs/src/components/CodeBlock';
import { CodeBlockPreComputed } from 'docs/src/components/CodeBlock/CodeBlockPreComputed';
import { Diagram } from './Diagram';
import * as Figure from './Figure';
import * as Table from './Table';
import { Video } from './Video';
import './mdx-components.css';

export const mdxComponents = {
  ...mdxComponentsCommon,
  h1: () => null,
  pre: ({
    tabIndex,
    ...props
  }: React.ComponentProps<'pre'> & React.ComponentProps<typeof CodeBlockPreComputed>) =>
    'data-precompute' in props ? (
      <CodeBlock.Root className="MdFigure MdBlogArticleBreakout">
        <CodeBlockPreComputed {...props} />
      </CodeBlock.Root>
    ) : (
      <CodeBlock.Pre {...props} />
    ),
  table: (props: React.ComponentProps<'table'>) => (
    <Table.Root {...props} className="MdBlogArticleBreakout" />
  ),
  thead: Table.Head,
  tbody: Table.Body,
  tr: Table.Row,
  th: (props: React.ComponentProps<'th'>) =>
    props.scope === 'row' ? <Table.RowHeader {...props} /> : <Table.ColumnHeader {...props} />,
  td: Table.Cell,
  // Custom components
  Diagram,
  Figure: (props: React.ComponentProps<'figure'>) => (
    <Figure.Root {...props} className="MdBlogArticleBreakout" />
  ),
  FigureFrame: Figure.Frame,
  Figcaption: Figure.Caption,
  Video,
};

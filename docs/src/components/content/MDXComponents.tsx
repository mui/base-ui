import * as React from 'react';
import * as CodeBlock from 'docs/src/components/CodeBlock';
import { ComponentLinkHeader } from './ComponentLinkHeader';
import { InstallationInstructions } from './InstallationInstructions';
import { Callout } from './Callout';
import { PackageManagerSnippet, Npm, Pnpm, Yarn } from './PackageManagerSnippet';

export const components = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
    const { id, children, ...other } = props;

    if (id) {
      return (
        <h2 id={id} {...other}>
          <a href={`#${id}`}>{children}</a>
        </h2>
      );
    }

    return <h2 {...props} />;
  },
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => {
    const { id, children, ...other } = props;

    if (id) {
      return (
        <h3 id={id} {...other}>
          <a href={`#${id}`}>{children}</a>
        </h3>
      );
    }

    return <h3 {...props} />;
  },
  figure: (props: React.ComponentProps<'figure'>) => {
    if ('data-rehype-pretty-code-figure' in props) {
      return <CodeBlock.Root className="my-5" {...props} />;
    }

    return <figure {...props} />;
  },
  figcaption: (props: React.ComponentProps<'figcaption'>) => {
    if ('data-rehype-pretty-code-title' in props) {
      return <CodeBlock.Panel {...props} />;
    }

    return <figcaption {...props} />;
  },
  // Don't pass the tabindex prop from shiki, most browsers
  // now handle scroll containers focus out of the box
  pre: ({ tabIndex, ...props }: React.ComponentProps<'pre'>) => <CodeBlock.Pre {...props} />,
  Callout,
  ComponentLinkHeader,
  InstallationInstructions,
  PackageManagerSnippet,
  Npm,
  Pnpm,
  Yarn,
};

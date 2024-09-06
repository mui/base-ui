/* eslint-disable jsx-a11y/heading-has-content */
import * as React from 'react';
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
  Callout,
  ComponentLinkHeader,
  InstallationInstructions,
  PackageManagerSnippet,
  Npm,
  Pnpm,
  Yarn,
};

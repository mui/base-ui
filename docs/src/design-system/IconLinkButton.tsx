import * as React from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { type UrlObject } from 'url';
import classes from './IconButton.module.css';
import { Tooltip } from './Tooltip';

export function IconLinkButton(props: IconLinkButton.Props) {
  const { size = 1, useNextLink, label, withTooltip, ...other } = props;
  const link = useNextLink ? (
    <Link
      aria-label={label}
      {...(other as React.ComponentPropsWithoutRef<typeof Link>)}
      className={clsx(classes.root, classes[`size-${size}`], props.className)}
    />
  ) : (
    <a
      aria-label={label}
      {...(other as React.ComponentPropsWithoutRef<'a'>)}
      className={clsx(classes.root, classes[`size-${size}`], props.className)}
    />
  );

  if (withTooltip) {
    return <Tooltip label={label}>{link}</Tooltip>;
  }

  return link;
}

export namespace IconLinkButton {
  export type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    size?: 1 | 2 | 3;
    label: string;
    withTooltip?: boolean;
  } & (
      | {
          useNextLink?: false;
          href?: string;
        }
      | {
          useNextLink: true;
          href: string | UrlObject;
        }
    );
}

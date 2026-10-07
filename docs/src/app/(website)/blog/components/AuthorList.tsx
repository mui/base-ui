import * as React from 'react';
import clsx from 'clsx';
import { Avatar } from '@base-ui/react/avatar';

import './AuthorList.css';

export function Root(props: React.ComponentProps<'ul'>) {
  return <ul {...props} className={clsx('AuthorListBlogRoot', props.className)} />;
}

interface ItemProps extends React.ComponentProps<'li'> {
  name: string;
  image?: string;
  url?: string;
}

export function Item(props: ItemProps) {
  const { name, image, url, className, ...other } = props;
  const initials = name
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('');

  return (
    <li {...other} className={clsx('AuthorListBlogItem', className)}>
      <Avatar.Root className="AuthorListBlogAvatar" aria-hidden="true">
        <Avatar.Image
          keepMounted
          src={image}
          alt=""
          width={24}
          height={24}
          className="AuthorListBlogImage"
        />
        <Avatar.Fallback className="AuthorListBlogFallback">{initials}</Avatar.Fallback>
      </Avatar.Root>
      {url ? (
        <a className="AuthorListBlogLink" href={url}>
          {name}
        </a>
      ) : (
        <span>{name}</span>
      )}
    </li>
  );
}

import * as React from 'react';
import classes from './EditPageGithubLink.module.css';

export interface EditPageGithubLinkProps {
  category: string;
  slug: string;
}

const REPO_ROOT = 'https://github.com/mui/base-ui/';
// #default-branch-switch
const DEFAULT_BRANCH = 'master';

export function EditPageGithubLink(props: EditPageGithubLinkProps) {
  const { category, slug } = props;

  const url = `${REPO_ROOT}/edit/${DEFAULT_BRANCH}/docs/data/${category}/${slug}/${slug}.mdx`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={classes.root}>
      Edit this page on GitHub
    </a>
  );
}

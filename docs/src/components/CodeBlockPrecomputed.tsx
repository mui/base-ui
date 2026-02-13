import * as React from 'react';
import { CodeHighlighter } from '@mui/internal-docs-infra/CodeHighlighter';
import type { CodeHighlighterProps } from '@mui/internal-docs-infra/CodeHighlighter/types';
import { CodeBlockContent } from './CodeBlockContent';

type PreProps = {
  'data-name'?: string;
  'data-slug'?: string;
  'data-precompute'?: string;
  'data-content-props'?: string;
};

export function CodeBlockPrecomputed(props: PreProps) {
  if (!props['data-precompute']) {
    return (
      <div>
        Expected precompute data to be provided. Ensure that transformHtmlCode rehype plugin is
        used.
      </div>
    );
  }

  const precompute = JSON.parse(
    props['data-precompute'],
  ) as CodeHighlighterProps<object>['precompute'];

  const contentProps = props['data-content-props']
    ? JSON.parse(props['data-content-props'])
    : ({} as Record<string, unknown> | null);

  return (
    <CodeHighlighter
      name={props['data-name']}
      slug={props['data-slug']}
      precompute={precompute}
      Content={CodeBlockContent}
      contentProps={contentProps}
    />
  );
}

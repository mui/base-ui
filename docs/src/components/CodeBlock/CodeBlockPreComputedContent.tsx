'use client';

import * as React from 'react';
import type { ContentProps } from '@mui/internal-docs-infra/CodeHighlighter/types';
import { useCode } from '@mui/internal-docs-infra/useCode';
import * as CodeBlock from './CodeBlock';

export function CodeBlockPreComputedContent(props: ContentProps<object>) {
  const code = useCode(props);

  return <CodeBlock.Pre>{code.selectedFile}</CodeBlock.Pre>;
}

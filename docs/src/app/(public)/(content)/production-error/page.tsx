import * as React from 'react';
import { notFound } from 'next/navigation';
import codes from './error-codes.json';
import Page from './Page.mdx';
import * as CodeBlock from '../../../../components/CodeBlock';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function ensureArray(input: string | string[] | undefined): string[] {
  if (input === undefined) {
    return [];
  }
  return Array.isArray(input) ? input : [input];
}

export default async function ProductionError(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const code = Number(searchParams.code);

  if (Number.isNaN(code)) {
    notFound();
  }

  const msg = (codes as Partial<Record<string, string>>)[code];

  if (!msg) {
    notFound();
  }

  const args = ensureArray(searchParams[`args[]`]);
  const resolvedMsg = msg.replace(/\$(\d+)/g, (_, index) => args[Number(index) - 1]);

  // This is a server component, this should be safe:
  // eslint-disable-next-line react/no-unstable-nested-components
  function FormattedErrorMessage() {
    return <CodeBlock.Pre>{resolvedMsg}</CodeBlock.Pre>;
  }

  return <Page components={{ FormattedErrorMessage }} />;
}

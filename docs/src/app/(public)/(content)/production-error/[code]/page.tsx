import * as React from 'react';
import { notFound } from 'next/navigation';
import Page from './Page.mdx';
import codes from '../../../../../error-codes.json';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function ensureArray(input: string | string[] | undefined): string[] {
  if (input === undefined) {
    return [];
  }
  return Array.isArray(input) ? input : [input];
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return Object.keys(codes).map((code) => ({ code }));
}

export default async function ProductionError(props: {
  params: Promise<{ code: string }>;
  searchParams: SearchParams;
}) {
  const params = await props.params;
  const code = Number(params.code);

  if (Number.isNaN(code)) {
    notFound();
  }

  const msg = (codes as Partial<Record<string, string>>)[code];

  if (!msg) {
    notFound();
  }

  const searchParams = await props.searchParams;
  const args = ensureArray(searchParams[`args[]`]);
  const resolvedMsg = msg.replace(/\$(\d+)/g, (_, index) => args[Number(index) - 1]);

  return <Page msg={resolvedMsg} />;
}

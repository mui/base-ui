import * as React from 'react';
import { notFound } from 'next/navigation';
import PageContent from './PageContent.mdx';
import codes from '../../../../../error-codes.json';
import ErrorDisplay from './ErrorDisplay';

export const dynamicParams = false;

export async function generateStaticParams() {
  return Object.keys(codes).map((code) => ({ code }));
}

export default async function ProductionError(props: {
  params: Promise<{ code: string }>;
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

  return <PageContent components={{ ErrorDisplay }} msg={msg} />;
}

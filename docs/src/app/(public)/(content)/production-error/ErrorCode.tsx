'use client';
import { useSearchParams } from 'next/navigation';

export interface ErrorDisplayProps {
  msg: string;
}

/**
 * Client component that interpolates arguments in an error message. Must be
 * a client component because it reads the search params.
 */
export default function ErrorDisplay() {
  return useSearchParams().get('code') ?? '';
}

'use client';
import * as React from 'react';

export function useContext<T>(
  Context: React.Context<T | undefined>,
  errorMessage: string,
  optional: boolean = false,
) {
  const context = React.useContext(Context);
  if (context === undefined && !optional) {
    throw new Error(errorMessage);
  }
  return context;
}

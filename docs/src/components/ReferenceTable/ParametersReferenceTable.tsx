import * as React from 'react';
import type { ProcessedHookParameter, ProcessedProperty } from '@mui/internal-docs-infra/useTypes';
import { ReferenceAccordion } from './ReferenceAccordion';

interface ParametersReferenceTableProps extends React.ComponentPropsWithoutRef<any> {
  data: Record<string, ProcessedHookParameter>;
  name: string;
  renameFrom?: string;
  renameTo?: string;
}

function normalizeParameters(data: Record<string, ProcessedHookParameter>) {
  return Object.fromEntries(
    Object.entries(data).map(([name, param]) => {
      const { optional, ...rest } = param as ProcessedHookParameter & { optional?: boolean };
      return [
        name,
        {
          ...rest,
          required: optional ? undefined : true,
        },
      ];
    }),
  ) as Record<string, ProcessedProperty>;
}

export async function ParametersReferenceTable({
  data,
  name,
  renameFrom,
  renameTo,
  ...props
}: ParametersReferenceTableProps) {
  return (
    <ReferenceAccordion
      {...props}
      name={name}
      data={normalizeParameters(data)}
      renameFrom={renameFrom}
      renameTo={renameTo}
      nameLabel="Parameter"
      caption="Function parameters table"
    />
  );
}

import * as React from 'react';
import type { EnhancedHookParameter, EnhancedProperty } from '@mui/internal-docs-infra/useTypes';
import { ReferenceAccordion } from './ReferenceAccordion';

interface ParametersReferenceTableProps extends React.ComponentPropsWithoutRef<any> {
  data: Record<string, EnhancedHookParameter>;
  name: string;
}

function normalizeParameters(data: Record<string, EnhancedHookParameter>) {
  return Object.fromEntries(
    Object.entries(data).map(([name, param]) => {
      const { optional, ...rest } = param as EnhancedHookParameter & { optional?: boolean };
      return [
        name,
        {
          ...rest,
          required: optional ? undefined : true,
        },
      ];
    }),
  ) as Record<string, EnhancedProperty>;
}

export function ParametersReferenceTable({ data, name, ...props }: ParametersReferenceTableProps) {
  return (
    <ReferenceAccordion
      {...props}
      name={name}
      data={normalizeParameters(data)}
      nameLabel="Parameter"
      caption="Function parameters table"
    />
  );
}

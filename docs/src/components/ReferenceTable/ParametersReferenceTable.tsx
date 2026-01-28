import * as React from 'react';
import { ReferenceAccordion } from './ReferenceAccordion';
import type { FunctionParamDef, PropDef } from './types';

interface ParametersReferenceTableProps extends React.ComponentPropsWithoutRef<any> {
  data: Record<string, FunctionParamDef>;
  name: string;
  renameFrom?: string;
  renameTo?: string;
}

function normalizeParameters(data: Record<string, FunctionParamDef>) {
  return Object.fromEntries(
    Object.entries(data).map(([name, param]) => {
      const { optional, ...rest } = param;
      const normalized: PropDef = {
        ...rest,
        required: optional ? undefined : true,
      };
      return [name, normalized];
    }),
  );
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

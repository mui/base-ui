import * as React from 'react';

// Raw JSON format as stored in reference/generated/*.json files
export interface RawComponentDef {
  name: string;
  description?: string;
  props: Record<string, RawPropDef>;
  dataAttributes: Record<string, RawAttributeDef>;
  cssVariables: Record<string, RawCssVariableDef>;
}

export interface RawPropDef {
  type?: string;
  shortType?: string;
  shortTypeText?: string;
  expanded?: string;
  detailedType?: string;
  default?: string;
  defaultText?: string;
  required?: boolean;
  description?: string;
  example?: string;
}

export interface RawAttributeDef {
  type?: string;
  description?: string;
}

export interface RawCssVariableDef {
  type?: string;
  description?: string;
}

// Processed format after hastToJsx conversion (used in components)
export interface ComponentDef {
  name: string;
  description?: React.ReactNode;
  props: Record<string, PropDef>;
  dataAttributes: Record<string, AttributeDef>;
  cssVariables: Record<string, CssVariableDef>;
}

export interface PropDef {
  type?: React.ReactNode;
  shortType?: React.ReactNode;
  shortTypeText?: string;
  expanded?: React.ReactNode;
  detailedType?: React.ReactNode;
  default?: React.ReactNode;
  defaultText?: string;
  required?: boolean;
  description?: React.ReactNode;
  example?: React.ReactNode;
}

export interface AttributeDef {
  type?: React.ReactNode;
  description?: React.ReactNode;
}

export interface CssVariableDef {
  type?: React.ReactNode;
  description?: React.ReactNode;
}

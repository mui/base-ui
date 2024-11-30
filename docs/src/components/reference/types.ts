export interface ComponentDef {
  name: string;
  description?: string;
  props: Record<string, PropDef>;
  attributes?: Record<string, AttributeDef>;
  cssVariables?: Record<string, CssVariableDef>;
}

export interface PropDef {
  type?: string;
  default?: string;
  required?: boolean;
  description?: string;
}

export interface AttributeDef {
  type?: string;
  description?: string;
}

export interface CssVariableDef {
  type?: string;
  description?: string;
}

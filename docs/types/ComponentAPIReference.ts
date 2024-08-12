export interface ComponentPropReference {
  name: string;
  type: {
    name: string;
    description: string | undefined;
  };
  defaultValue: string | null;
  description: string;
}

export interface ComponentAPIReference {
  name: string;
  description: string | undefined;
  props: ComponentPropReference[];
}

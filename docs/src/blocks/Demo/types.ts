export interface DemoFile {
  path: string;
  name: string;
  content: string;
  prettyContent?: string;
  type: string;
}

export interface DemoVariant {
  name: string;
  language: 'ts' | 'js';
  component: React.ComponentType;
  files: DemoFile[];
}

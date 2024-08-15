export type DemoFileType = 'ts' | 'js' | 'json' | 'css';

export interface DemoFile {
  path: string;
  name: string;
  content: string;
  prettyContent?: string;
  type: DemoFileType;
}

export interface DemoVariant {
  name: string;
  language: 'ts' | 'js';
  component: React.ComponentType;
  files: DemoFile[];
}

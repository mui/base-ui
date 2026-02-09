import { Editor as EditorComponent } from './root/Editor';
import * as Parts from './index.parts';

export const Editor = Object.assign(EditorComponent, Parts);

export * from './hooks/useEditor';
export * from './hooks/useSelection';
export * from './utils/SerializerRegistry';
export * from './utils/toHTML';
export * from './plugins/KeyboardShortcutsPlugin';
export * from './plugins/AIAutocompletePlugin';
export * from './plugins/CodePlugin';

import { $getEditor, type EditorState } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import type { SerializerRegistry, SerializerRuleSets } from './SerializerRegistry';

export interface ToHTMLOptions {
  registry?: SerializerRegistry | undefined;
  overrides?: Partial<SerializerRuleSets> | undefined;
}

// MVP: delegate to Lexical's HTML generator for core nodes.
// Future: integrate registry rules for custom nodes/marks by mapping them into Lexical's export pipeline or post-processing.
export function toHTML(editorState: EditorState, _options?: ToHTMLOptions | undefined): string {
  return editorState.read(() => {
    return $generateHtmlFromNodes($getEditor(), null);
  });
}

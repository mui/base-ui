'use client';
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_NORMAL,
  KEY_TAB_COMMAND,
  createCommand,
  LexicalCommand,
  DecoratorNode,
  NodeKey,
  SerializedLexicalNode,
  $getNodeByKey,
  $createTextNode,
  LexicalEditor,
  EditorConfig,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { useTimeout } from '@base-ui/utils/useTimeout';

export type SerializedAICompletionNode = SerializedLexicalNode & {
  completion: string;
};

export class AICompletionNode extends DecoratorNode<React.ReactNode> {
  completion: string;

  static getType(): string {
    return 'ai-completion';
  }

  static clone(node: AICompletionNode): AICompletionNode {
    // eslint-disable-next-line no-underscore-dangle
    return new AICompletionNode(node.completion, node.__key);
  }

  constructor(completion: string, key?: NodeKey | undefined) {
    super(key);
    this.completion = completion;
  }

  isInline(): boolean {
    return true;
  }

  isKeyboardSelectable(): boolean {
    return false;
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.style.display = 'inline';
    return span;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(editor: LexicalEditor, config: EditorConfig): React.ReactNode {
    return (
      <span className={config.theme.aiCompletion}>
        {this.completion}
      </span>
    );
  }

  static importJSON(serializedNode: SerializedAICompletionNode): AICompletionNode {
    return $createAICompletionNode(serializedNode.completion);
  }

  exportJSON(): SerializedAICompletionNode {
    return {
      ...super.exportJSON(),
      completion: this.completion,
      type: 'ai-completion',
      version: 1,
    };
  }
}

export function $createAICompletionNode(completion: string): AICompletionNode {
  return new AICompletionNode(completion);
}

export function $isAICompletionNode(node: any): node is AICompletionNode {
  return node instanceof AICompletionNode;
}

export interface AIAutocompletePluginProps {
  /**
   * A function that returns a completion string based on the current text.
   */
  getCompletion: (text: string) => Promise<string | null>;
  /**
   * Debounce time in ms before calling getCompletion.
   * @default 500
   */
  debounceMs?: number | undefined;
}

export const SET_AI_COMPLETION_COMMAND: LexicalCommand<string | null> = createCommand('SET_AI_COMPLETION_COMMAND');

export function AIAutocompletePlugin(props: AIAutocompletePluginProps) {
  const { getCompletion, debounceMs = 500 } = props;
  const [editor] = useLexicalComposerContext();
  const [completion, setCompletion] = React.useState<string | null>(null);
  const completionTimeout = useTimeout();
  const completionNodeKeyRef = React.useRef<NodeKey | null>(null);

  const clearCompletion = React.useCallback(() => {
    if (completionNodeKeyRef.current) {
      const key = completionNodeKeyRef.current;
      editor.update(() => {
        const node = $getNodeByKey(key);
        if ($isAICompletionNode(node)) {
          node.remove();
        }
      });
      completionNodeKeyRef.current = null;
    }
    setCompletion(null);
  }, [editor]);

  const updateCompletion = React.useCallback(async () => {
    const text = editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return null;
      }
      const anchor = selection.anchor;
      if (anchor.type !== 'text') {
        return null;
      }
      const node = anchor.getNode();
      // Ensure we are at the end of the text node
      if (anchor.offset !== node.getTextContentSize()) {
        return null;
      }
      return node.getTextContent().slice(0, anchor.offset);
    });

    if (text === null || text.trim() === '') {
      clearCompletion();
      return;
    }

    const result = await getCompletion(text);

    // Check for staleness
    const isStale = editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return true;
      }
      const anchor = selection.anchor;
      if (anchor.type !== 'text') {
        return true;
      }
      const node = anchor.getNode();
      if (anchor.offset !== node.getTextContentSize()) {
        return true;
      }
      return node.getTextContent().slice(0, anchor.offset) !== text;
    });

    if (isStale) {
      return;
    }

    if (result) {
      setCompletion(result);
      editor.update(() => {
        // Remove existing completion node if any
        if (completionNodeKeyRef.current) {
          const prevNode = $getNodeByKey(completionNodeKeyRef.current);
          if ($isAICompletionNode(prevNode)) {
            prevNode.remove();
          }
        }

        const selection = $getSelection();
        if ($isRangeSelection(selection) && selection.isCollapsed()) {
          const anchor = selection.anchor;
          const prevOffset = anchor.offset;
          const prevNodeKey = anchor.key;

          const completionNode = $createAICompletionNode(result);
          selection.insertNodes([completionNode]);
          completionNodeKeyRef.current = completionNode.getKey();

          // Restore selection to before the completion node
          const newSelection = $getSelection();
          if ($isRangeSelection(newSelection)) {
            newSelection.anchor.set(prevNodeKey, prevOffset, 'text');
            newSelection.focus.set(prevNodeKey, prevOffset, 'text');
          }
        }
      });
    } else {
      clearCompletion();
    }
  }, [editor, getCompletion, clearCompletion]);

  React.useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener((payload) => {
        const { dirtyElements } = payload;
        const dirtyNodes = (payload as { dirtyNodes?: Map<string, unknown> | undefined }).dirtyNodes;

        if (dirtyElements.size === 0 && (dirtyNodes?.size ?? 0) === 0) {
          return;
        }

        completionTimeout.start(debounceMs, updateCompletion);
      }),
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (event: KeyboardEvent) => {
          if (completion && completionNodeKeyRef.current) {
            event.preventDefault();
            editor.update(() => {
              const node = $getNodeByKey(completionNodeKeyRef.current!);
              if ($isAICompletionNode(node)) {
                const textToInsert = node.completion;
                const textNode = $createTextNode(textToInsert);
                node.replace(textNode);
                completionNodeKeyRef.current = null;

                // Move selection to the end of the inserted text
                textNode.select();
              }
            });
            setCompletion(null);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_NORMAL,
      ),
      editor.registerCommand(
        SET_AI_COMPLETION_COMMAND,
        (payload) => {
          setCompletion(payload);
          if (payload === null) {
            clearCompletion();
          }
          return true;
        },
        COMMAND_PRIORITY_LOW,
      )
    );
  }, [editor, completion, debounceMs, updateCompletion, clearCompletion, completionTimeout]);

  return null;
}

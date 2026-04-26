import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { searchKeymap } from '@codemirror/search';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { useEffect, useRef } from 'react';

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder: string;
};

const CHANGE_DEBOUNCE_MS = 120;

export function MarkdownEditor({
  value,
  onChange,
  ariaLabel,
  placeholder,
}: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<EditorView | null>(null);
  const latestValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) {
      return;
    }

    const editor = new EditorView({
      parent: containerRef.current,
      state: EditorState.create({
        doc: latestValueRef.current,
        extensions: [
          history(),
          markdown(),
          keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({
            'aria-label': ariaLabel,
            'data-placeholder': placeholder,
            role: 'textbox',
          }),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) {
              return;
            }

            const nextValue = update.state.doc.toString();
            latestValueRef.current = nextValue;

            if (debounceRef.current) {
              window.clearTimeout(debounceRef.current);
            }

            debounceRef.current = window.setTimeout(() => {
              onChangeRef.current(nextValue);
            }, CHANGE_DEBOUNCE_MS);
          }),
        ],
      }),
    });

    editorRef.current = editor;

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }

      editor.destroy();
      editorRef.current = null;
    };
  }, [ariaLabel, placeholder]);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor || value === editor.state.doc.toString()) {
      return;
    }

    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: value,
      },
    });
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="bruma-editor h-full min-h-0 bg-[rgb(var(--color-editor))]"
    />
  );
}

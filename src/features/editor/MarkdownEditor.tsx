import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { searchKeymap } from '@codemirror/search';
import { Compartment, EditorState, RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  EditorView,
  keymap,
} from '@codemirror/view';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import type { SearchMatch } from '../search/search';

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder: string;
  activeSearchIndex?: number;
  searchMatches?: SearchMatch[];
};

const CHANGE_DEBOUNCE_MS = 120;

export type MarkdownEditorHandle = {
  focus: () => void;
};

function buildSearchDecorations(
  matches: SearchMatch[],
  activeIndex: number
): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();

  matches.forEach((match, index) => {
    builder.add(
      match.from,
      match.to,
      Decoration.mark({
        class:
          index === activeIndex
            ? 'cm-search-match cm-search-match-active'
            : 'cm-search-match',
      })
    );
  });

  return builder.finish();
}

function searchDecorationExtension(
  matches: SearchMatch[],
  activeIndex: number
) {
  return EditorView.decorations.of(
    buildSearchDecorations(matches, activeIndex)
  );
}

export const MarkdownEditor = forwardRef<
  MarkdownEditorHandle,
  MarkdownEditorProps
>(function MarkdownEditor(
  {
    value,
    onChange,
    ariaLabel,
    placeholder,
    activeSearchIndex = 0,
    searchMatches = [],
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<EditorView | null>(null);
  const latestValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const debounceRef = useRef<number | null>(null);
  const searchCompartmentRef = useRef(new Compartment());
  const normalizedActiveSearchIndex =
    searchMatches.length > 0
      ? Math.min(activeSearchIndex, searchMatches.length - 1)
      : 0;
  const searchExtension = useMemo(
    () => searchDecorationExtension(searchMatches, normalizedActiveSearchIndex),
    [normalizedActiveSearchIndex, searchMatches]
  );

  useImperativeHandle(ref, () => ({
    focus: () => editorRef.current?.focus(),
  }));

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
          searchCompartmentRef.current.of(searchDecorationExtension([], 0)),
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

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.dispatch({
      effects: searchCompartmentRef.current.reconfigure(searchExtension),
    });
  }, [searchExtension]);

  useEffect(() => {
    const editor = editorRef.current;
    const activeMatch = searchMatches[normalizedActiveSearchIndex];

    if (!editor || !activeMatch) {
      return;
    }

    editor.dispatch({
      selection: {
        anchor: activeMatch.from,
        head: activeMatch.to,
      },
      scrollIntoView: true,
    });
  }, [normalizedActiveSearchIndex, searchMatches]);

  return (
    <div
      ref={containerRef}
      className="bruma-editor h-full min-h-0 bg-[rgb(var(--color-editor))]"
    />
  );
});

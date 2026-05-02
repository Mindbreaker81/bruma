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
import { useScrollSyncStore } from '../preview/scrollSync';

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder: string;
  activeSearchIndex?: number;
  searchMatches?: SearchMatch[];
  tabSize?: number;
  lineWrapping?: boolean;
  fontFamily?: string;
};

const CHANGE_DEBOUNCE_MS = 120;

export type MarkdownEditorHandle = {
  focus: () => void;
  scrollToLine: (line: number) => void;
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
    tabSize = 4,
    lineWrapping = true,
    fontFamily = 'sans',
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<EditorView | null>(null);
  const latestValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const debounceRef = useRef<number | null>(null);
  const ignoreNextScrollRef = useRef(false);
  const hadSearchSelectionRef = useRef(false);
  const contentAttributesCompartmentRef = useRef(new Compartment());
  const searchCompartmentRef = useRef(new Compartment());
  const tabSizeCompartmentRef = useRef(new Compartment());
  const lineWrappingCompartmentRef = useRef(new Compartment());
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
    scrollToLine: (line: number) => {
      const editor = editorRef.current;
      if (!editor) return;
      const totalLines = editor.state.doc.lines;
      const target = Math.min(Math.max(line + 1, 1), totalLines);
      const { from } = editor.state.doc.line(target);
      editor.dispatch({
        selection: { anchor: from, head: from },
        scrollIntoView: true,
      });
      editor.focus();
    },
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
          tabSizeCompartmentRef.current.of(EditorState.tabSize.of(tabSize)),
          lineWrappingCompartmentRef.current.of(
            lineWrapping ? EditorView.lineWrapping : []
          ),
          searchCompartmentRef.current.of(searchDecorationExtension([], 0)),
          contentAttributesCompartmentRef.current.of(
            EditorView.contentAttributes.of({
              'aria-label': ariaLabel,
              'data-placeholder': placeholder,
              role: 'textbox',
            })
          ),
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
          EditorView.domEventHandlers({
            scroll(_event, view) {
              if (ignoreNextScrollRef.current) {
                ignoreNextScrollRef.current = false;
                return false;
              }
              const scroller = view.scrollDOM;
              const max = scroller.scrollHeight - scroller.clientHeight;
              if (max <= 0) return false;
              const ratio = scroller.scrollTop / max;
              useScrollSyncStore.getState().emit('editor', ratio);
              return false;
            },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ariaLabel, placeholder]);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.dispatch({
      effects: contentAttributesCompartmentRef.current.reconfigure(
        EditorView.contentAttributes.of({
          'aria-label': ariaLabel,
          'data-placeholder': placeholder,
          role: 'textbox',
        })
      ),
    });
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
    if (!editor) return;
    editor.dispatch({
      effects: tabSizeCompartmentRef.current.reconfigure(
        EditorState.tabSize.of(tabSize)
      ),
    });
  }, [tabSize]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.dispatch({
      effects: lineWrappingCompartmentRef.current.reconfigure(
        lineWrapping ? EditorView.lineWrapping : []
      ),
    });
  }, [lineWrapping]);

  useEffect(() => {
    return useScrollSyncStore.subscribe((state, prev) => {
      if (!state.enabled) return;
      if (state.source !== 'preview') return;
      if (state.ratio === prev.ratio && state.source === prev.source) return;
      const editor = editorRef.current;
      if (!editor) return;
      const scroller = editor.scrollDOM;
      const max = scroller.scrollHeight - scroller.clientHeight;
      if (max <= 0) return;
      ignoreNextScrollRef.current = true;
      scroller.scrollTop = state.ratio * max;
    });
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    const activeMatch = searchMatches[normalizedActiveSearchIndex];

    if (!editor) return;

    if (!activeMatch) {
      if (hadSearchSelectionRef.current) {
        hadSearchSelectionRef.current = false;
        const anchor = editor.state.selection.main.anchor;
        editor.dispatch({ selection: { anchor, head: anchor } });
      }
      return;
    }

    hadSearchSelectionRef.current = true;
    editor.dispatch({
      selection: {
        anchor: activeMatch.from,
        head: activeMatch.to,
      },
      scrollIntoView: true,
    });
  }, [normalizedActiveSearchIndex, searchMatches]);

  const fontStyle =
    fontFamily === 'serif'
      ? { fontFamily: 'ui-serif, Georgia, Cambria, serif' }
      : fontFamily === 'mono'
        ? {
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          }
        : undefined;

  return (
    <div
      ref={containerRef}
      className="bruma-editor h-full min-h-0 bg-background"
      style={fontStyle}
    />
  );
});

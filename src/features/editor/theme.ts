import { EditorView } from '@codemirror/view';

export const brumaLightTheme = EditorView.theme(
  {
    '&': {
      color: 'hsl(var(--foreground))',
      backgroundColor: 'transparent',
    },
    '.cm-content': { caretColor: 'hsl(var(--primary))' },
    '.cm-cursor': { borderLeftColor: 'hsl(var(--primary))' },
    '.cm-selectionBackground': { backgroundColor: 'hsl(var(--accent))' },
  },
  { dark: false }
);

export const brumaDarkTheme = EditorView.theme(
  {
    '&': {
      color: 'hsl(var(--foreground))',
      backgroundColor: 'transparent',
    },
    '.cm-content': { caretColor: 'hsl(var(--primary))' },
    '.cm-cursor': { borderLeftColor: 'hsl(var(--primary))' },
    '.cm-selectionBackground': { backgroundColor: 'hsl(var(--accent))' },
  },
  { dark: true }
);

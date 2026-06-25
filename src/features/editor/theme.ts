import { EditorView } from '@codemirror/view';

const sharedGutterStyles = {
  '.cm-gutters': {
    backgroundColor: 'transparent',
    borderRight: '1px solid hsl(var(--border))',
    color: 'hsl(var(--muted-foreground))',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    color: 'hsl(var(--muted-foreground))',
    padding: '0 0.5em',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
    color: 'hsl(var(--foreground))',
  },
};

export const brumaLightTheme = EditorView.theme(
  {
    '&': {
      color: 'hsl(var(--foreground))',
      backgroundColor: 'transparent',
    },
    '.cm-content': { caretColor: 'hsl(var(--primary))' },
    '.cm-cursor': { borderLeftColor: 'hsl(var(--primary))' },
    '.cm-selectionBackground': { backgroundColor: 'hsl(var(--accent))' },
    ...sharedGutterStyles,
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
    ...sharedGutterStyles,
  },
  { dark: true }
);

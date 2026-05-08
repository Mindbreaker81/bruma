import { type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import type { MarkdownEditorHandle } from '../editor/MarkdownEditor';
import { FORMAT_COMMANDS_BY_ID } from '../editor/formatCommands';

type MarkdownGuideProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editorRef: RefObject<MarkdownEditorHandle | null>;
};

type GuideSection = {
  titleKey: string;
  items: GuideItem[];
};

type GuideItem = {
  /** Identifier from FORMAT_COMMANDS, when the entry maps to a command. */
  commandId?: keyof typeof FORMAT_COMMANDS_BY_ID;
  /** Markdown shown as the example (also used as the snippet to insert). */
  sample: string;
  /** Optional override of the snippet inserted on click. */
  snippet?: string;
  /** i18n key of the description. */
  descriptionKey: string;
};

const SECTIONS: GuideSection[] = [
  {
    titleKey: 'editor.format.guide.section.headings',
    items: [
      {
        commandId: 'h1',
        sample: '# Título 1',
        descriptionKey: 'editor.format.h1',
      },
      {
        commandId: 'h2',
        sample: '## Título 2',
        descriptionKey: 'editor.format.h2',
      },
      {
        commandId: 'h3',
        sample: '### Título 3',
        descriptionKey: 'editor.format.h3',
      },
    ],
  },
  {
    titleKey: 'editor.format.guide.section.emphasis',
    items: [
      {
        commandId: 'bold',
        sample: '**negrita**',
        descriptionKey: 'editor.format.bold',
      },
      {
        commandId: 'italic',
        sample: '_cursiva_',
        descriptionKey: 'editor.format.italic',
      },
      {
        commandId: 'strike',
        sample: '~~tachado~~',
        descriptionKey: 'editor.format.strike',
      },
      {
        commandId: 'code',
        sample: '`código`',
        descriptionKey: 'editor.format.code',
      },
    ],
  },
  {
    titleKey: 'editor.format.guide.section.lists',
    items: [
      {
        commandId: 'ul',
        sample: '- elemento\n- otro',
        descriptionKey: 'editor.format.ul',
      },
      {
        commandId: 'ol',
        sample: '1. primero\n2. segundo',
        descriptionKey: 'editor.format.ol',
      },
      {
        commandId: 'task',
        sample: '- [ ] pendiente\n- [x] hecho',
        descriptionKey: 'editor.format.task',
      },
      {
        commandId: 'quote',
        sample: '> cita',
        descriptionKey: 'editor.format.quote',
      },
    ],
  },
  {
    titleKey: 'editor.format.guide.section.blocks',
    items: [
      {
        commandId: 'link',
        sample: '[texto](https://ejemplo.com)',
        descriptionKey: 'editor.format.link',
      },
      {
        commandId: 'image',
        sample: '![alt](imagen.png)',
        descriptionKey: 'editor.format.image',
      },
      {
        commandId: 'codeblock',
        sample: '```\ncódigo\n```',
        descriptionKey: 'editor.format.codeblock',
      },
      {
        commandId: 'table',
        sample: '| a | b |\n| - | - |\n| 1 | 2 |',
        descriptionKey: 'editor.format.table',
      },
      {
        commandId: 'hr',
        sample: '---',
        descriptionKey: 'editor.format.hr',
      },
    ],
  },
];

export function MarkdownGuide({
  open,
  onOpenChange,
  editorRef,
}: MarkdownGuideProps) {
  const { t } = useTranslation();

  function handleInsert(item: GuideItem) {
    const editor = editorRef.current;
    if (!editor) return;
    if (item.commandId) {
      editor.applyFormat(FORMAT_COMMANDS_BY_ID[item.commandId].action);
    } else {
      editor.insertSnippet(item.snippet ?? item.sample);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('editor.format.guide.title')}</DialogTitle>
          <DialogDescription>
            {t('editor.format.guide.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {SECTIONS.map((section) => (
            <section key={section.titleKey}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t(section.titleKey)}
              </h3>
              <ul className="space-y-1.5">
                {section.items.map((item) => (
                  <li key={item.sample}>
                    <button
                      type="button"
                      onClick={() => handleInsert(item)}
                      className="group flex w-full items-start justify-between gap-3 rounded-md border border-transparent px-2 py-1.5 text-left transition hover:border-border hover:bg-muted"
                    >
                      <pre className="m-0 whitespace-pre-wrap break-words font-mono text-xs text-foreground">
                        {item.sample}
                      </pre>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {t(item.descriptionKey)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

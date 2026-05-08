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
  /** i18n key of the markdown shown as the example. */
  sampleKey: string;
  /** i18n key of the description. */
  descriptionKey: string;
};

const SECTIONS: GuideSection[] = [
  {
    titleKey: 'editor.format.guide.section.headings',
    items: [
      {
        commandId: 'h1',
        sampleKey: 'editor.format.guide.sample.h1',
        descriptionKey: 'editor.format.h1',
      },
      {
        commandId: 'h2',
        sampleKey: 'editor.format.guide.sample.h2',
        descriptionKey: 'editor.format.h2',
      },
      {
        commandId: 'h3',
        sampleKey: 'editor.format.guide.sample.h3',
        descriptionKey: 'editor.format.h3',
      },
    ],
  },
  {
    titleKey: 'editor.format.guide.section.emphasis',
    items: [
      {
        commandId: 'bold',
        sampleKey: 'editor.format.guide.sample.bold',
        descriptionKey: 'editor.format.bold',
      },
      {
        commandId: 'italic',
        sampleKey: 'editor.format.guide.sample.italic',
        descriptionKey: 'editor.format.italic',
      },
      {
        commandId: 'strike',
        sampleKey: 'editor.format.guide.sample.strike',
        descriptionKey: 'editor.format.strike',
      },
      {
        commandId: 'code',
        sampleKey: 'editor.format.guide.sample.code',
        descriptionKey: 'editor.format.code',
      },
    ],
  },
  {
    titleKey: 'editor.format.guide.section.lists',
    items: [
      {
        commandId: 'ul',
        sampleKey: 'editor.format.guide.sample.ul',
        descriptionKey: 'editor.format.ul',
      },
      {
        commandId: 'ol',
        sampleKey: 'editor.format.guide.sample.ol',
        descriptionKey: 'editor.format.ol',
      },
      {
        commandId: 'task',
        sampleKey: 'editor.format.guide.sample.task',
        descriptionKey: 'editor.format.task',
      },
      {
        commandId: 'quote',
        sampleKey: 'editor.format.guide.sample.quote',
        descriptionKey: 'editor.format.quote',
      },
    ],
  },
  {
    titleKey: 'editor.format.guide.section.blocks',
    items: [
      {
        commandId: 'link',
        sampleKey: 'editor.format.guide.sample.link',
        descriptionKey: 'editor.format.link',
      },
      {
        commandId: 'image',
        sampleKey: 'editor.format.guide.sample.image',
        descriptionKey: 'editor.format.image',
      },
      {
        commandId: 'codeblock',
        sampleKey: 'editor.format.guide.sample.codeblock',
        descriptionKey: 'editor.format.codeblock',
      },
      {
        commandId: 'table',
        sampleKey: 'editor.format.guide.sample.table',
        descriptionKey: 'editor.format.table',
      },
      {
        commandId: 'hr',
        sampleKey: 'editor.format.guide.sample.hr',
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
      editor.insertSnippet(t(item.sampleKey));
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
                  <li key={item.sampleKey}>
                    <button
                      type="button"
                      onClick={() => handleInsert(item)}
                      className="group flex w-full items-start justify-between gap-3 rounded-md border border-transparent px-2 py-1.5 text-left transition hover:border-border hover:bg-muted"
                    >
                      <pre className="m-0 whitespace-pre-wrap break-words font-mono text-xs text-foreground">
                        {t(item.sampleKey)}
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

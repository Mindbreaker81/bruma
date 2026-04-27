import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';

type PreferencesDialogProps = {
  open: boolean;
  onClose: () => void;
  autosaveEnabled: boolean;
  autosaveDelayMs: number;
  editorFontFamily: string;
  editorTabSize: number;
  editorShowGutter: boolean;
  editorWrap: boolean;
  previewMaxWidth: number;
  previewShowToc: boolean;
  onAutosaveEnabledChange: (enabled: boolean) => void;
  onAutosaveDelayMsChange: (delayMs: number) => void;
  onEditorFontFamilyChange: (family: string) => void;
  onEditorTabSizeChange: (size: number) => void;
  onEditorShowGutterChange: (show: boolean) => void;
  onEditorWrapChange: (wrap: boolean) => void;
  onPreviewMaxWidthChange: (width: number) => void;
  onPreviewShowTocChange: (show: boolean) => void;
};

export function PreferencesDialog({
  open,
  onClose,
  autosaveEnabled,
  autosaveDelayMs,
  editorFontFamily,
  editorTabSize,
  editorShowGutter,
  editorWrap,
  previewMaxWidth,
  previewShowToc,
  onAutosaveEnabledChange,
  onAutosaveDelayMsChange,
  onEditorFontFamilyChange,
  onEditorTabSizeChange,
  onEditorShowGutterChange,
  onEditorWrapChange,
  onPreviewMaxWidthChange,
  onPreviewShowTocChange,
}: PreferencesDialogProps) {
  const { t } = useTranslation();

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('preferences.title')}</DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex flex-1 flex-col gap-6 overflow-y-auto px-1 py-1">
          {/* General Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('preferences.general')}
            </h3>

            <div className="flex items-center justify-between">
              <label htmlFor="pref-autosave" className="text-sm font-medium">
                {t('autosave.toggle')}
              </label>
              <input
                id="pref-autosave"
                type="checkbox"
                checked={autosaveEnabled}
                onChange={(e) => onAutosaveEnabledChange(e.target.checked)}
                className="size-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <label
                htmlFor="pref-autosave-delay"
                className="text-sm font-medium"
              >
                {t('autosave.delay')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="pref-autosave-delay"
                  type="number"
                  min="1"
                  max="60"
                  value={autosaveDelayMs / 1000}
                  onChange={(e) =>
                    onAutosaveDelayMsChange(Number(e.target.value) * 1000)
                  }
                  className="w-16 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <span className="text-sm text-muted-foreground">
                  {t('autosave.seconds')}
                </span>
              </div>
            </div>
          </section>

          {/* Editor Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('preferences.editor')}
            </h3>

            <div className="flex items-center justify-between">
              <label htmlFor="pref-font" className="text-sm font-medium">
                {t('preferences.fontFamily')}
              </label>
              <select
                id="pref-font"
                value={editorFontFamily}
                onChange={(e) =>
                  onEditorFontFamilyChange(e.target.value as 'sans' | 'mono')
                }
                className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="sans">{t('preferences.fontFamilySans')}</option>
                <option value="mono">{t('preferences.fontFamilyMono')}</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="pref-tabsize" className="text-sm font-medium">
                {t('preferences.tabSize')}
              </label>
              <input
                id="pref-tabsize"
                type="number"
                min="2"
                max="8"
                step="2"
                value={editorTabSize}
                onChange={(e) => onEditorTabSizeChange(Number(e.target.value))}
                className="w-16 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="pref-gutter" className="text-sm font-medium">
                {t('preferences.showGutter')}
              </label>
              <input
                id="pref-gutter"
                type="checkbox"
                checked={editorShowGutter}
                onChange={(e) => onEditorShowGutterChange(e.target.checked)}
                className="size-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="pref-wrap" className="text-sm font-medium">
                {t('preferences.wordWrap')}
              </label>
              <input
                id="pref-wrap"
                type="checkbox"
                checked={editorWrap}
                onChange={(e) => onEditorWrapChange(e.target.checked)}
                className="size-4"
              />
            </div>
          </section>

          {/* Preview Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('preferences.preview')}
            </h3>

            <div className="flex items-center justify-between">
              <label htmlFor="pref-max-width" className="text-sm font-medium">
                {t('preferences.maxWidth')}
              </label>
              <input
                id="pref-max-width"
                type="range"
                min="20"
                max="200"
                step="1"
                value={previewMaxWidth}
                onChange={(e) =>
                  onPreviewMaxWidthChange(Number(e.target.value))
                }
              />
              <span className="tabular-nums">{previewMaxWidth}ch</span>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="pref-show-toc" className="text-sm font-medium">
                {t('preferences.showToc')}
              </label>
              <input
                id="pref-show-toc"
                type="checkbox"
                checked={previewShowToc}
                onChange={(e) => onPreviewShowTocChange(e.target.checked)}
                className="size-4"
              />
            </div>
          </section>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>{t('preferences.close')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

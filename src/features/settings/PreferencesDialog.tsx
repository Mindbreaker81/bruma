import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Slider } from '../../components/ui/slider';
import { Switch } from '../../components/ui/switch';

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
              <Switch
                id="pref-autosave"
                checked={autosaveEnabled}
                onCheckedChange={onAutosaveEnabledChange}
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
              <Select
                value={editorFontFamily}
                onValueChange={onEditorFontFamilyChange}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sans">
                    {t('preferences.fontFamilySans')}
                  </SelectItem>
                  <SelectItem value="mono">
                    {t('preferences.fontFamilyMono')}
                  </SelectItem>
                </SelectContent>
              </Select>
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
              <Checkbox
                id="pref-gutter"
                checked={editorShowGutter}
                onCheckedChange={(v) => onEditorShowGutterChange(Boolean(v))}
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="pref-wrap" className="text-sm font-medium">
                {t('preferences.wordWrap')}
              </label>
              <Checkbox
                id="pref-wrap"
                checked={editorWrap}
                onCheckedChange={(v) => onEditorWrapChange(Boolean(v))}
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
              <Slider
                value={[previewMaxWidth]}
                min={20}
                max={200}
                step={1}
                onValueChange={([v]) =>
                  onPreviewMaxWidthChange(v ?? previewMaxWidth)
                }
                aria-valuetext={`${previewMaxWidth}ch`}
              />
              <span className="tabular-nums">{previewMaxWidth}ch</span>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="pref-show-toc" className="text-sm font-medium">
                {t('preferences.showToc')}
              </label>
              <Checkbox
                id="pref-show-toc"
                checked={previewShowToc}
                onCheckedChange={(v) => onPreviewShowTocChange(Boolean(v))}
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

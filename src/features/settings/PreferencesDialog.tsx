import { useTranslation } from 'react-i18next';

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
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 px-4">
      <section
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefs-dialog-title"
      >
        <div className="flex items-center justify-between border-b border-[rgb(var(--color-border))] px-5 py-3">
          <h2 className="text-base font-semibold" id="prefs-dialog-title">
            {t('preferences.title')}
          </h2>
          <button
            className="rounded-md px-2 py-1 text-sm text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            onClick={onClose}
          >
            {t('preferences.close')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <fieldset className="mb-5">
            <legend className="mb-2 text-sm font-medium">
              {t('preferences.general')}
            </legend>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autosaveEnabled}
                  onChange={(e) => onAutosaveEnabledChange(e.target.checked)}
                />
                {t('preferences.autosaveEnabled')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                {t('preferences.autosaveDelay')}
                <input
                  type="range"
                  min={500}
                  max={30000}
                  step={500}
                  value={autosaveDelayMs}
                  onChange={(e) =>
                    onAutosaveDelayMsChange(Number(e.target.value))
                  }
                  disabled={!autosaveEnabled}
                />
                <span className="tabular-nums">{autosaveDelayMs}ms</span>
              </label>
            </div>
          </fieldset>

          <fieldset className="mb-5">
            <legend className="mb-2 text-sm font-medium">
              {t('preferences.editor')}
            </legend>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                {t('preferences.fontFamily')}
                <select
                  value={editorFontFamily}
                  onChange={(e) => onEditorFontFamilyChange(e.target.value)}
                  className="rounded border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-2 py-1 text-sm"
                >
                  <option value="sans">{t('preferences.fontSans')}</option>
                  <option value="serif">{t('preferences.fontSerif')}</option>
                  <option value="mono">{t('preferences.fontMono')}</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm">
                {t('preferences.tabSize')}
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={editorTabSize}
                  onChange={(e) =>
                    onEditorTabSizeChange(Number(e.target.value))
                  }
                  className="w-16 rounded border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] px-2 py-1 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editorWrap}
                  onChange={(e) => onEditorWrapChange(e.target.checked)}
                />
                {t('preferences.wrapLines')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editorShowGutter}
                  onChange={(e) => onEditorShowGutterChange(e.target.checked)}
                />
                {t('preferences.showGutter')}
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">
              {t('preferences.preview')}
            </legend>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                {t('preferences.maxWidth')}
                <input
                  type="range"
                  min={20}
                  max={200}
                  step={1}
                  value={previewMaxWidth}
                  onChange={(e) =>
                    onPreviewMaxWidthChange(Number(e.target.value))
                  }
                />
                <span className="tabular-nums">{previewMaxWidth}ch</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={previewShowToc}
                  onChange={(e) => onPreviewShowTocChange(e.target.checked)}
                />
                {t('preferences.showToc')}
              </label>
            </div>
          </fieldset>
        </div>
      </section>
    </div>
  );
}

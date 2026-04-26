import { useTranslation } from 'react-i18next';

type ConfirmDirtyDialogProps = {
  open: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSave: () => void;
};

export function ConfirmDirtyDialog({
  open,
  onCancel,
  onDiscard,
  onSave,
}: ConfirmDirtyDialogProps) {
  const { t } = useTranslation();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 px-4">
      <section
        className="w-full max-w-md rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-5 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dirty-dialog-title"
      >
        <h2 className="text-base font-semibold" id="dirty-dialog-title">
          {t('confirmDirty.title')}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--color-muted))]">
          {t('confirmDirty.body')}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-md px-3 py-2 text-sm text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            onClick={onCancel}
          >
            {t('confirmDirty.cancel')}
          </button>
          <button
            className="rounded-md px-3 py-2 text-sm text-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-control-hover))] hover:text-[rgb(var(--color-text))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            onClick={onDiscard}
          >
            {t('confirmDirty.discard')}
          </button>
          <button
            className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            type="button"
            onClick={onSave}
          >
            {t('confirmDirty.save')}
          </button>
        </div>
      </section>
    </div>
  );
}

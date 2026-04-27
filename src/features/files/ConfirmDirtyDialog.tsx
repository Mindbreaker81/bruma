import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

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

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirmDirty.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('confirmDirty.body')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {t('confirmDirty.cancel')}
          </AlertDialogCancel>
          <Button variant="outline" onClick={onDiscard}>
            {t('confirmDirty.discard')}
          </Button>
          <AlertDialogAction
            onClick={onSave}
            className="bg-emerald-700 text-white hover:bg-emerald-800"
          >
            {t('confirmDirty.save')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

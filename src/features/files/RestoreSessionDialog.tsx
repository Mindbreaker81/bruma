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

type RestoreSessionDialogProps = {
  open: boolean;
  hasPath: boolean;
  onRecover: () => void;
  onDiscard: () => void;
  onViewDiff?: () => void;
};

export function RestoreSessionDialog({
  open,
  hasPath,
  onRecover,
  onDiscard,
  onViewDiff,
}: RestoreSessionDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onDiscard()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('session.restoreTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {hasPath
              ? t('session.restoreBody')
              : t('session.restoreBodyUntitled')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {onViewDiff && (
            <Button variant="ghost" onClick={onViewDiff}>
              {t('session.viewDiff')}
            </Button>
          )}
          <AlertDialogCancel onClick={onDiscard}>
            {t('session.discard')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onRecover}
            className="bg-emerald-700 text-white hover:bg-emerald-800"
          >
            {t('session.recover')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

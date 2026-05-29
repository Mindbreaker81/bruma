import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IconButton } from '../../../components/ui/icon-button';

type UpdateIndicatorProps = {
  available: boolean;
  onOpen: () => void;
};

export function UpdateIndicator({ available, onOpen }: UpdateIndicatorProps) {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <IconButton
        icon={Download}
        label={
          available ? t('updates.indicatorAvailable') : t('updates.checkNow')
        }
        onClick={onOpen}
        active={available}
        className="size-8 rounded-md"
      />
      {available ? (
        <span
          className="absolute right-1 top-1 size-2 rounded-full bg-red-500 ring-2 ring-background"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

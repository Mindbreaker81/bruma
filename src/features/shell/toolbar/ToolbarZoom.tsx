import { useTranslation } from 'react-i18next';

import { RotateCcw, Plus, Minus } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { IconButton, ToolbarGroup } from '../../../components/ui/icon-button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';

type ToolbarZoomProps = {
  fontScale: number;
  resetFontScaleStore: () => void;
  decreaseFontScaleStore: () => void;
  increaseFontScaleStore: () => void;
};

export function ToolbarZoom({
  fontScale,
  resetFontScaleStore,
  decreaseFontScaleStore,
  increaseFontScaleStore,
}: ToolbarZoomProps) {
  const { t } = useTranslation();

  return (
    <ToolbarGroup label={t('toolbar.zoom')}>
      <IconButton
        icon={Minus}
        label={t('zoom.decrease')}
        onClick={decreaseFontScaleStore}
        className="rounded-full"
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={fontScale === 1 ? 'ghost' : 'outline'}
            size="sm"
            onClick={resetFontScaleStore}
            className="h-9 min-w-14 rounded-full px-3 text-xs font-semibold tabular-nums"
          >
            {fontScale !== 1 && (
              <RotateCcw className="mr-1 size-3" aria-hidden />
            )}
            {Math.round(fontScale * 100)}%
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('zoom.reset')}</TooltipContent>
      </Tooltip>
      <IconButton
        icon={Plus}
        label={t('zoom.increase')}
        onClick={increaseFontScaleStore}
        className="rounded-full"
      />
    </ToolbarGroup>
  );
}

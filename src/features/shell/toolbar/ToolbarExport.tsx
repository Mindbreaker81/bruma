import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Button } from '../../../components/ui/button';
import { ToolbarGroup } from '../../../components/ui/icon-button';
import { Download } from 'lucide-react';

type ToolbarExportProps = {
  isExportMenuOpen: boolean;
  setIsExportMenuOpen: (open: boolean) => void;
  handleExportHtml: (styled: boolean) => Promise<void>;
  handleExportPdf: () => void;
};

export function ToolbarExport({
  isExportMenuOpen,
  setIsExportMenuOpen,
  handleExportHtml,
  handleExportPdf,
}: ToolbarExportProps) {
  const { t } = useTranslation();

  return (
    <ToolbarGroup label={t('toolbar.export')}>
      <DropdownMenu open={isExportMenuOpen} onOpenChange={setIsExportMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full"
            aria-label={t('export.title')}
          >
            <Download className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => void handleExportHtml(true)}>
            {t('export.htmlStyled')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void handleExportHtml(false)}>
            {t('export.htmlPlain')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void handleExportPdf()}>
            {t('export.pdf')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolbarGroup>
  );
}

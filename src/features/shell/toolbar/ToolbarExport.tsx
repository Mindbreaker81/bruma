import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenuCheckboxItem,
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
  handleExportHtml: (styled: boolean, embedImages: boolean) => Promise<void>;
};

export function ToolbarExport({
  isExportMenuOpen,
  setIsExportMenuOpen,
  handleExportHtml,
}: ToolbarExportProps) {
  const { t } = useTranslation();
  const [embedImages, setEmbedImages] = useState(false);

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
          <DropdownMenuCheckboxItem
            checked={embedImages}
            onCheckedChange={(checked) => setEmbedImages(checked === true)}
            onSelect={(event) => event.preventDefault()}
          >
            {t('export.embedImages')}
          </DropdownMenuCheckboxItem>
          <DropdownMenuItem
            onClick={() => void handleExportHtml(true, embedImages)}
          >
            {t('export.htmlStyled')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => void handleExportHtml(false, embedImages)}
          >
            {t('export.htmlPlain')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolbarGroup>
  );
}

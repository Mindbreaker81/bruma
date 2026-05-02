import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Button } from '../../../components/ui/button';
import { IconButton, ToolbarGroup } from '../../../components/ui/icon-button';
import {
  BUILTIN_TEMPLATES,
  applyTemplate,
  loadCustomTemplate,
} from '../../templates/templates';
import type { Template } from '../../templates/templates';
import { Save, Clock, FileInput, FileText, Printer } from 'lucide-react';

type ToolbarFileProps = {
  isTemplateMenuOpen: boolean;
  setIsTemplateMenuOpen: (open: boolean) => void;
  customTemplates: Template[];
  requestDirtyConfirmation: (onConfirm: () => void) => void;
  clearSession: () => void;
  resetUntitled: () => void;
  updateContent: (content: string) => void;
  setWelcomeDismissed: (dismissed: boolean) => void;
  handleOpenWithConfirmation: () => void;
  isRecentMenuOpen: boolean;
  setIsRecentMenuOpen: (open: boolean) => void;
  recentFiles: string[];
  handleOpenRecent: (path: string) => void;
  handleSave: () => Promise<boolean>;
  handlePrint: () => void;
};

function getPathBasename(path: string): string {
  return path.replace(/\\/g, '/').split('/').pop() ?? path;
}

export function ToolbarFile({
  isTemplateMenuOpen,
  setIsTemplateMenuOpen,
  customTemplates,
  requestDirtyConfirmation,
  clearSession,
  resetUntitled,
  updateContent,
  setWelcomeDismissed,
  handleOpenWithConfirmation,
  isRecentMenuOpen,
  setIsRecentMenuOpen,
  recentFiles,
  handleOpenRecent,
  handleSave,
  handlePrint,
}: ToolbarFileProps) {
  const { t } = useTranslation();

  return (
    <ToolbarGroup label={t('toolbar.file')}>
      <DropdownMenu
        open={isTemplateMenuOpen}
        onOpenChange={setIsTemplateMenuOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full"
            aria-label={t('actions.newDocument')}
          >
            <FileText className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {BUILTIN_TEMPLATES.map((template) => (
            <DropdownMenuItem
              key={template.id}
              onClick={() => {
                setIsTemplateMenuOpen(false);
                requestDirtyConfirmation(() => {
                  clearSession();
                  resetUntitled();
                  updateContent(applyTemplate(template));
                  setWelcomeDismissed(true);
                });
              }}
            >
              {t(template.name)}
            </DropdownMenuItem>
          ))}
          {customTemplates.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {customTemplates.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={async () => {
                    setIsTemplateMenuOpen(false);
                    requestDirtyConfirmation(async () => {
                      try {
                        const content = await loadCustomTemplate(template.id);
                        clearSession();
                        resetUntitled();
                        updateContent(applyTemplate({ ...template, content }));
                        setWelcomeDismissed(true);
                      } catch {
                        /* ignored */
                      }
                    });
                  }}
                >
                  {template.name}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <IconButton
        icon={FileInput}
        label={t('actions.openDocument')}
        onClick={handleOpenWithConfirmation}
        className="rounded-full"
      />
      <DropdownMenu open={isRecentMenuOpen} onOpenChange={setIsRecentMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full"
            aria-label={t('recent.open')}
          >
            <Clock className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-72 max-h-96 overflow-y-auto"
        >
          {recentFiles.length > 0 ? (
            recentFiles.map((path) => (
              <DropdownMenuItem
                key={path}
                onClick={() => handleOpenRecent(path)}
                title={path}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="block truncate font-medium">
                    {getPathBasename(path)}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {path}
                  </span>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>{t('recent.empty')}</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <IconButton
        icon={Save}
        label={t('actions.save')}
        onClick={() => void handleSave()}
        className="rounded-full"
      />
      <IconButton
        icon={Printer}
        label={t('actions.print')}
        onClick={handlePrint}
        className="rounded-full"
      />
    </ToolbarGroup>
  );
}

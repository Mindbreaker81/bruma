import type { ReactNode } from 'react';

import { Button } from './button';
import { Separator } from './separator';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

type IconButtonProps = {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
};

export function IconButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
  className,
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          data-active={active}
          className={`size-9 data-[active=true]:bg-muted data-[active=true]:text-foreground ${className ?? ''}`}
        >
          <Icon className="size-4" aria-hidden />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

type ToolbarGroupProps = {
  label: string;
  children: ReactNode;
};

export function ToolbarGroup({ label, children }: ToolbarGroupProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/60 bg-white/80 px-2 py-1 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-white/5">
      <span className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <Separator orientation="vertical" className="h-5 bg-border/80" />
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

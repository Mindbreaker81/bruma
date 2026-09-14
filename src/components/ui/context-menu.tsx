import { type ReactNode, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu';

type ContextMenuAreaProps = {
  /** Items rendered inside the dropdown once the menu opens. */
  menu: ReactNode;
  children: ReactNode;
};

/**
 * Right-click target plus a dropdown anchored to the pointer position.
 * The `contextmenu` handler only covers this subtree, so native menus
 * elsewhere (dialog inputs, etc.) keep working.
 */
export function ContextMenuArea({ menu, children }: ContextMenuAreaProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );

  return (
    <DropdownMenu
      modal={false}
      open={position !== null}
      onOpenChange={(open) => {
        if (!open) setPosition(null);
      }}
    >
      <DropdownMenuTrigger asChild>
        <span
          aria-hidden
          className="pointer-events-none fixed size-0"
          style={{ left: position?.x ?? 0, top: position?.y ?? 0 }}
        />
      </DropdownMenuTrigger>
      <div
        className="contents"
        onContextMenu={(event) => {
          event.preventDefault();
          setPosition({ x: event.clientX, y: event.clientY });
        }}
      >
        {children}
      </div>
      <DropdownMenuContent>{menu}</DropdownMenuContent>
    </DropdownMenu>
  );
}

/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

declare module 'lucide-react/dist/esm/icons/*.js' {
  import type { LucideIcon } from 'lucide-react';

  const Icon: LucideIcon;
  export default Icon;
}

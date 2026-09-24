/** ¿El foco está dentro del contenido de CodeMirror? */
export function isEditorFocused(): boolean {
  const active = document.activeElement;
  return (
    active instanceof HTMLElement && Boolean(active.closest('.cm-content'))
  );
}

/** ¿El foco está en un input/textarea nativo (búsqueda, diálogos…)? */
export function isNativeInputFocused(): boolean {
  const active = document.activeElement;
  return (
    active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
  );
}

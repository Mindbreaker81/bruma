export type AutosaveContext = {
  autosaveEnabled: boolean;
  isDirty: boolean;
  documentPath: string | null;
};

export function shouldAutosave(context: AutosaveContext): boolean {
  return (
    context.autosaveEnabled && context.isDirty && Boolean(context.documentPath)
  );
}

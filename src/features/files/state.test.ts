import { beforeEach, describe, expect, it } from 'vitest';

import { createUntitledDocument } from './document';
import { useFileStore } from './state';

describe('file store', () => {
  beforeEach(() => {
    const doc = createUntitledDocument();
    useFileStore.setState({
      tabs: [{ id: 'test-tab', document: doc }],
      activeTabId: 'test-tab',
      document: doc,
      isDirty: false,
      displayName: null,
      recentFiles: [],
    });
  });

  it('tracks edits and saved state transitions', () => {
    useFileStore.getState().updateContent('# Bruma');

    expect(useFileStore.getState().isDirty).toBe(true);
    expect(useFileStore.getState().document.content).toBe('# Bruma');

    useFileStore.getState().markSaved(123);

    expect(useFileStore.getState().isDirty).toBe(false);
    expect(useFileStore.getState().document.savedContent).toBe('# Bruma');
    expect(useFileStore.getState().document.lastSavedAt).toBe(123);
  });

  it('opens a document as clean state in a new tab', () => {
    useFileStore.getState().openTab({
      path: '/tmp/bruma.md',
      content: '# Bruma',
      eol: 'lf',
    });

    expect(useFileStore.getState().displayName).toBe('bruma.md');
    expect(useFileStore.getState().isDirty).toBe(false);
    expect(useFileStore.getState().tabs.length).toBe(2); // untitled + opened
  });

  it('activates existing tab instead of duplicating when path matches', () => {
    useFileStore.getState().openTab({
      path: '/tmp/bruma.md',
      content: '# Bruma',
      eol: 'lf',
    });
    const firstTabId = useFileStore.getState().activeTabId;

    useFileStore.getState().openTab({
      path: '/tmp/bruma.md',
      content: '# Updated',
      eol: 'lf',
    });

    expect(useFileStore.getState().tabs.length).toBe(2);
    expect(useFileStore.getState().activeTabId).toBe(firstTabId);
    expect(useFileStore.getState().document.content).toBe('# Updated');
  });

  it('does not overwrite dirty content when reopening an existing tab', () => {
    useFileStore.getState().openTab({
      path: '/tmp/bruma.md',
      content: '# Original',
      eol: 'lf',
    });
    useFileStore.getState().updateContent('# Unsaved');

    useFileStore.getState().openTab({
      path: '/tmp/bruma.md',
      content: '# Disk',
      eol: 'lf',
    });

    expect(useFileStore.getState().document.content).toBe('# Unsaved');
    expect(useFileStore.getState().isDirty).toBe(true);
  });

  it('closes tab and selects next when closing active', () => {
    useFileStore.getState().openTab({
      path: '/tmp/a.md',
      content: 'A',
      eol: 'lf',
    });
    useFileStore.getState().openTab({
      path: '/tmp/b.md',
      content: 'B',
      eol: 'lf',
    });
    const tabId = useFileStore.getState().activeTabId;
    useFileStore.getState().closeTab(tabId!);

    expect(useFileStore.getState().tabs.length).toBe(2);
    expect(useFileStore.getState().activeTabId).not.toBe(tabId);
  });

  it('moves tabs by index', () => {
    useFileStore.getState().openTab({
      path: '/tmp/a.md',
      content: 'A',
      eol: 'lf',
    });
    useFileStore.getState().openTab({
      path: '/tmp/b.md',
      content: 'B',
      eol: 'lf',
    });
    const tabs = useFileStore.getState().tabs;
    const middleId = tabs[1]!.id;
    const lastId = tabs[tabs.length - 1]!.id;

    useFileStore.getState().moveTab(lastId, 0);

    const moved = useFileStore.getState().tabs;
    expect(moved[0]!.id).toBe(lastId);
    expect(moved[1]!.id).toBe('test-tab');
    expect(moved[2]!.id).toBe(middleId);
  });
});

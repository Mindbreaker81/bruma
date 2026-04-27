import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TabBar } from './TabBar';
import type { Tab } from './document';
import { createLoadedDocument } from './document';

describe('TabBar', () => {
  it('renders null when there is only one untitled tab', () => {
    const tabs: Tab[] = [
      {
        id: '1',
        document: {
          id: 'doc-1',
          path: null,
          content: '',
          savedContent: '',
          encoding: 'utf-8',
          eol: 'lf',
          lastSavedAt: null,
        },
      },
    ];
    const { container } = render(
      <TabBar
        tabs={tabs}
        activeTabId="1"
        onActivate={() => {}}
        onClose={() => {}}
        onMove={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders tabs when there are multiple tabs or a saved file', () => {
    const tabs: Tab[] = [
      {
        id: '1',
        document: createLoadedDocument({
          path: '/a.md',
          content: 'a',
          eol: 'lf',
        }),
      },
      {
        id: '2',
        document: createLoadedDocument({
          path: '/b.md',
          content: 'b',
          eol: 'lf',
        }),
      },
    ];
    const { getByRole } = render(
      <TabBar
        tabs={tabs}
        activeTabId="1"
        onActivate={() => {}}
        onClose={() => {}}
        onMove={() => {}}
      />
    );
    expect(getByRole('tablist')).toBeInTheDocument();
  });

  it('sets aria-selected to true for active tab', () => {
    const tabs: Tab[] = [
      {
        id: '1',
        document: createLoadedDocument({
          path: '/a.md',
          content: 'a',
          eol: 'lf',
        }),
      },
      {
        id: '2',
        document: createLoadedDocument({
          path: '/b.md',
          content: 'b',
          eol: 'lf',
        }),
      },
    ];
    const { getAllByRole } = render(
      <TabBar
        tabs={tabs}
        activeTabId="1"
        onActivate={() => {}}
        onClose={() => {}}
        onMove={() => {}}
      />
    );
    const tabElements = getAllByRole('tab');
    expect(tabElements[0]).toHaveAttribute('aria-selected', 'true');
    if (tabElements[1]) {
      expect(tabElements[1]).toHaveAttribute('aria-selected', 'false');
    }
  });

  it('shows dirty indicator for unsaved tabs', () => {
    const tabs: Tab[] = [
      {
        id: '1',
        document: {
          id: 'doc-1',
          path: '/a.md',
          content: 'modified',
          savedContent: 'original',
          encoding: 'utf-8',
          eol: 'lf',
          lastSavedAt: 12345,
        },
      },
      {
        id: '2',
        document: createLoadedDocument({
          path: '/b.md',
          content: 'b',
          eol: 'lf',
        }),
      },
    ];
    const { getAllByRole } = render(
      <TabBar
        tabs={tabs}
        activeTabId="1"
        onActivate={() => {}}
        onClose={() => {}}
        onMove={() => {}}
      />
    );
    const tabElements = getAllByRole('tab');
    // First tab should have dirty indicator (amber dot)
    expect(tabElements[0]?.querySelector('.bg-amber-500')).toBeInTheDocument();
    // Second tab should not have dirty indicator
    expect(
      tabElements[1]?.querySelector('.bg-amber-500')
    ).not.toBeInTheDocument();
  });

  it('calls onActivate when clicking a tab', () => {
    const onActivate = vi.fn();
    const tabs: Tab[] = [
      {
        id: '1',
        document: createLoadedDocument({
          path: '/a.md',
          content: 'a',
          eol: 'lf',
        }),
      },
      {
        id: '2',
        document: createLoadedDocument({
          path: '/b.md',
          content: 'b',
          eol: 'lf',
        }),
      },
    ];
    const { getAllByRole } = render(
      <TabBar
        tabs={tabs}
        activeTabId="1"
        onActivate={onActivate}
        onClose={() => {}}
        onMove={() => {}}
      />
    );
    const tabButtons = getAllByRole('tab');
    const button = tabButtons[1]?.querySelector('button');
    if (button) button.click();
    expect(onActivate).toHaveBeenCalledWith('2');
  });

  it('calls onClose when clicking close button', () => {
    const onClose = vi.fn();
    const tabs: Tab[] = [
      {
        id: '1',
        document: createLoadedDocument({
          path: '/a.md',
          content: 'a',
          eol: 'lf',
        }),
      },
      {
        id: '2',
        document: createLoadedDocument({
          path: '/b.md',
          content: 'b',
          eol: 'lf',
        }),
      },
    ];
    const { getAllByLabelText } = render(
      <TabBar
        tabs={tabs}
        activeTabId="1"
        onActivate={() => {}}
        onClose={onClose}
        onMove={() => {}}
      />
    );
    const closeButton = getAllByLabelText(/close/i)[0];
    if (closeButton) closeButton.click();
    expect(onClose).toHaveBeenCalledWith('1');
  });
});

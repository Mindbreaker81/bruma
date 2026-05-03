import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useScrollSyncStore } from '../preview/scrollSync';
import { MarkdownEditor } from './MarkdownEditor';

describe('MarkdownEditor scroll sync', () => {
  afterEach(() => {
    useScrollSyncStore.setState({
      enabled: true,
      ratio: 0,
      source: null,
    });
  });

  it('does not emit editor scroll when sync is disabled', () => {
    useScrollSyncStore.getState().setEnabled(false);

    const { container } = render(
      <MarkdownEditor
        value={'# Title\n\n'.repeat(100)}
        onChange={() => undefined}
        ariaLabel="Markdown"
        placeholder="Write"
      />
    );

    const scroller = container.querySelector('.cm-scroller') as HTMLElement;
    Object.defineProperty(scroller, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(scroller, 'clientHeight', {
      configurable: true,
      value: 500,
    });
    scroller.scrollTop = 250;

    fireEvent.scroll(scroller);

    expect(useScrollSyncStore.getState()).toMatchObject({
      enabled: false,
      ratio: 0,
      source: null,
    });
  });

  it('emits editor scroll when sync is enabled', () => {
    const { container } = render(
      <MarkdownEditor
        value={'# Title\n\n'.repeat(100)}
        onChange={() => undefined}
        ariaLabel="Markdown"
        placeholder="Write"
      />
    );

    const scroller = container.querySelector('.cm-scroller') as HTMLElement;
    Object.defineProperty(scroller, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(scroller, 'clientHeight', {
      configurable: true,
      value: 500,
    });
    scroller.scrollTop = 250;

    fireEvent.scroll(scroller);

    expect(useScrollSyncStore.getState()).toMatchObject({
      enabled: true,
      ratio: 0.5,
      source: 'editor',
    });
  });
});

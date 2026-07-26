import { describe, expect, it } from 'vitest';

import { findSearchMatches } from '../features/search/search';
import { getTextStats } from './textStats';

const MIB = 1024 * 1024;
const MAX_OPERATION_MS = 500;

function measure(operation: () => void): number {
  const start = performance.now();
  operation();
  return performance.now() - start;
}

describe('large document performance', () => {
  it.each([2, 5, 10])(
    'keeps statistics and search bounded for %d MiB',
    (sizeMiB) => {
      const content = 'word '.repeat(Math.ceil((sizeMiB * MIB) / 5));
      const statsMs = measure(() => getTextStats(content));
      const searchMs = measure(() =>
        findSearchMatches(content, 'missing-token', true)
      );

      console.info(
        `${sizeMiB} MiB: stats=${statsMs.toFixed(1)}ms search=${searchMs.toFixed(1)}ms`
      );
      expect(statsMs).toBeLessThan(MAX_OPERATION_MS);
      expect(searchMs).toBeLessThan(MAX_OPERATION_MS);
    }
  );
});

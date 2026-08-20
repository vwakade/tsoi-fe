import fs from 'fs';
import path from 'path';

import {
  NO_ACCESS_PAGE_POST_LISTINGS,
  NO_ACCESS_PAGE_INITIATE_TRANSACTIONS,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  NO_ACCESS_PAGE_VIEW_LISTINGS,
} from '../../util/urlHelpers';

/**
 * NoAccessPage renders NotFoundPage for any `missingAccessRight` it does not recognise
 * (see NoAccessPage.js). So redirecting there with an unsupported value turns "you do
 * not have access" into a confusing 404 — silently, with no routing error and no failing
 * render test, because NamedRedirect still renders fine.
 *
 * That happened: role guards on the dashboard pages redirected with
 * `missingAccessRight: 'rights'`, which is not a supported value.
 *
 * Component tests do not catch this — they assert the guarded content is absent, which
 * stays true whichever wrong place the user lands. So this checks the source directly.
 */

const VALID_VALUES = [
  NO_ACCESS_PAGE_POST_LISTINGS,
  NO_ACCESS_PAGE_INITIATE_TRANSACTIONS,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  NO_ACCESS_PAGE_VIEW_LISTINGS,
];

const SRC_DIR = path.resolve(__dirname, '../..');

const collectJsFiles = dir => {
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((acc, entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return acc.concat(collectJsFiles(full));
    }
    // Production source only. Test files legitimately use unsupported values —
    // NoAccessPage.test.js exercises the unknown-value path on purpose.
    const isSource =
      /\.(js|jsx)$/.test(entry.name) && !/\.(test|example)\.(js|jsx)$/.test(entry.name);
    return isSource ? acc.concat(full) : acc;
  }, []);
};

// Matches `missingAccessRight: 'value'` and `missingAccessRight="value"`.
const USAGE_PATTERN = /missingAccessRight\s*[:=]\s*['"]([^'"]+)['"]/g;

describe('missingAccessRight values used across src', () => {
  it('are all values NoAccessPage actually handles', () => {
    const offenders = [];

    collectJsFiles(SRC_DIR).forEach(file => {
      const contents = fs.readFileSync(file, 'utf8');
      let match;
      while ((match = USAGE_PATTERN.exec(contents)) !== null) {
        const value = match[1];
        if (!VALID_VALUES.includes(value)) {
          offenders.push(`${path.relative(SRC_DIR, file)} uses "${value}"`);
        }
      }
    });

    expect(offenders).toEqual([]);
  });
});

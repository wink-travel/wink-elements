import { describe, expect, it } from 'vitest';
import {
  latestReleaseTag,
  nextBump,
  nextVersion,
  parseCommit,
  rcVersion,
  renderChangelogEntry,
} from './release-lib.mjs';

const commit = (subject, body = '', hash = 'abcdef1234567') => ({ hash, subject, body });

describe('parseCommit', () => {
  it('reads type, scope, breaking marker and description', () => {
    expect(parseCommit(commit('feat(loader)!: add x'))).toMatchObject({
      type: 'feat',
      scope: 'loader',
      breaking: true,
      description: 'add x',
    });
  });

  it('keeps emoji-style descriptions', () => {
    expect(parseCommit(commit('fix: :memo: changed comments')).description).toBe(
      ':memo: changed comments',
    );
  });

  it('detects a BREAKING CHANGE footer', () => {
    expect(parseCommit(commit('fix: x', 'BREAKING CHANGE: gone')).breaking).toBe(true);
  });

  it('returns null for non-conventional subjects', () => {
    expect(parseCommit(commit('Merge branch main'))).toBeNull();
  });
});

describe('nextBump', () => {
  it('is major for a breaking change', () => {
    expect(nextBump([commit('fix: a'), commit('feat!: b')])).toBe('major');
  });
  it('is minor for a feature', () => {
    expect(nextBump([commit('fix: a'), commit('feat: b')])).toBe('minor');
  });
  it('is patch for fix, perf and revert', () => {
    expect(nextBump([commit('perf: a')])).toBe('patch');
    expect(nextBump([commit('revert: a')])).toBe('patch');
    expect(nextBump([commit('fix: a')])).toBe('patch');
  });
  it('is null when nothing is releasable', () => {
    expect(nextBump([commit('docs: a'), commit('chore: b'), commit('nonsense')])).toBeNull();
  });
});

describe('nextVersion', () => {
  it.each([
    ['1.0.3', 'patch', '1.0.4'],
    ['1.0.3', 'minor', '1.1.0'],
    ['1.4.3', 'major', '2.0.0'],
  ])('%s + %s = %s', (from, bump, to) => {
    expect(nextVersion(from, bump)).toBe(to);
  });

  it('rejects a non-semver version', () => {
    expect(() => nextVersion('1.0', 'patch')).toThrow(/semver/);
  });
});

describe('renderChangelogEntry', () => {
  const args = {
    version: '1.1.0',
    previousTag: 'v1.0.3',
    date: '2026-11-06',
    repoUrl: 'https://github.com/wink-travel/wink-elements',
  };

  it('groups releasable commits and links the compare range and hashes', () => {
    const out = renderChangelogEntry({
      ...args,
      commits: [commit('feat: new thing'), commit('fix(x): bug', '', '1111111aaaa'), commit('docs: skip')],
    });
    expect(out).toContain(
      '## [1.1.0](https://github.com/wink-travel/wink-elements/compare/v1.0.3...1.1.0) (2026-11-06)',
    );
    expect(out).toContain('### Features\n\n* new thing ([abcdef1](https://github.com/wink-travel/wink-elements/commit/abcdef1234567))');
    expect(out).toContain('### Bug Fixes\n\n* **x:** bug');
    expect(out).not.toContain('skip');
  });

  it('lists breaking changes', () => {
    const out = renderChangelogEntry({ ...args, commits: [commit('feat!: drop it', 'BREAKING CHANGE: api removed')] });
    expect(out).toContain('### BREAKING CHANGES');
  });
});

describe('latestReleaseTag', () => {
  it('prefers the highest bare-semver tag, comparing numerically', () => {
    expect(latestReleaseTag(['1.0.9', '1.0.10', 'v2.0.0', '1.0.2-rc.1'])).toBe('1.0.10');
  });
  it('falls back to the highest v-prefixed tag before the first trunk-based release', () => {
    expect(latestReleaseTag(['v1.0.2', 'v1.0.3', 'nonsense'])).toBe('v1.0.3');
  });
  it('is empty when there are no release tags', () => {
    expect(latestReleaseTag(['foo'])).toBe('');
  });
});

describe('rcVersion', () => {
  it('uses the bump from releasable commits', () => {
    expect(rcVersion('1.0.3', [commit('feat: a')], '12')).toBe('1.1.0-rc.12');
  });
  it('falls back to a patch bump when nothing is releasable', () => {
    expect(rcVersion('1.0.3', [commit('docs: a')], '7')).toBe('1.0.4-rc.7');
  });
  it('requires a numeric build number', () => {
    expect(() => rcVersion('1.0.3', [], 'x')).toThrow(/build number/);
  });
});

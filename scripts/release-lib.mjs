// Pure helpers for release.bash: version bump and changelog entry from conventional commits.

const SUBJECT = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE:\s*(.+)$/m;

const SECTIONS = [
  ['feat', 'Features'],
  ['fix', 'Bug Fixes'],
  ['perf', 'Performance Improvements'],
  ['revert', 'Reverts'],
];
const RELEASABLE = new Set(SECTIONS.map(([type]) => type));

export function parseCommit({ hash, subject, body = '' }) {
  const match = SUBJECT.exec(subject.trim());
  if (!match) return null;
  const [, type, scope, bang, description] = match;
  const footer = BREAKING_FOOTER.exec(body);
  return {
    hash,
    type,
    scope: scope ?? null,
    description,
    breaking: Boolean(bang) || Boolean(footer),
    breakingNote: footer ? footer[1] : null,
  };
}

function parseAll(commits) {
  return commits.map(parseCommit).filter(Boolean);
}

export function nextBump(commits) {
  const parsed = parseAll(commits);
  if (parsed.some((c) => c.breaking)) return 'major';
  if (parsed.some((c) => c.type === 'feat')) return 'minor';
  if (parsed.some((c) => RELEASABLE.has(c.type))) return 'patch';
  return null;
}

export function nextVersion(current, bump) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);
  if (!match) throw new Error(`"${current}" is not a MAJOR.MINOR.PATCH semver version`);
  const [major, minor, patch] = match.slice(1).map(Number);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  if (bump === 'patch') return `${major}.${minor}.${patch + 1}`;
  throw new Error(`unknown bump "${bump}"`);
}

function bullet(commit, repoUrl) {
  const scope = commit.scope ? `**${commit.scope}:** ` : '';
  const short = commit.hash.slice(0, 7);
  return `* ${scope}${commit.description} ([${short}](${repoUrl}/commit/${commit.hash}))`;
}

export function renderChangelogEntry({ version, previousTag, date, repoUrl, commits }) {
  const parsed = parseAll(commits);
  const heading = previousTag
    ? `## [${version}](${repoUrl}/compare/${previousTag}...${version}) (${date})`
    : `## ${version} (${date})`;
  const blocks = SECTIONS.map(([type, title]) => {
    const items = parsed.filter((c) => c.type === type).map((c) => bullet(c, repoUrl));
    return items.length ? `### ${title}\n\n${items.join('\n')}` : null;
  });
  const breaking = parsed
    .filter((c) => c.breaking)
    .map((c) => `* ${c.breakingNote ?? c.description}`);
  blocks.push(breaking.length ? `### BREAKING CHANGES\n\n${breaking.join('\n')}` : null);
  return `${heading}\n\n\n${blocks.filter(Boolean).join('\n\n')}\n`;
}

const compareSemver = (a, b) => {
  const [x, y] = [a, b].map((tag) => tag.replace(/^v/, '').split('.').map(Number));
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

function highest(tags, pattern) {
  return tags.filter((tag) => pattern.test(tag)).sort(compareSemver).at(-1) ?? '';
}

// The tag the next release is measured from: the highest bare-semver tag, or, before the first
// trunk-based release, the highest v-prefixed tag (v1.0.3).
export function latestReleaseTag(tags) {
  return highest(tags, /^\d+\.\d+\.\d+$/) || highest(tags, /^v\d+\.\d+\.\d+$/);
}

// A release-candidate version for staging: the version the next release would have, plus -rc.<build>.
// Without releasable commits it still bumps the patch, so the candidate sorts above the last release.
export function rcVersion(current, commits, buildNumber) {
  if (!/^\d+$/.test(buildNumber)) throw new Error(`"${buildNumber}" is not a numeric build number`);
  return `${nextVersion(current, nextBump(commits) ?? 'patch')}-rc.${buildNumber}`;
}

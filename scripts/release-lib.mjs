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

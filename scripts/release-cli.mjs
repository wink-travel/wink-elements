// CLI used by release.bash. Reads the commits since a tag from git; changes nothing itself.
//   node scripts/release-cli.mjs next-version <previousTag>
//   node scripts/release-cli.mjs changelog <version> <previousTag> <repoUrl>
// An empty <previousTag> means "all history".
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { nextBump, nextVersion, renderChangelogEntry } from './release-lib.mjs';

function commitsSince(tag) {
  const range = tag ? [`${tag}..HEAD`] : [];
  const raw = execFileSync('git', ['log', '--format=%H%x1f%s%x1f%b%x1e', ...range], {
    encoding: 'utf8',
  });
  return raw
    .split('\x1e')
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, subject, body = ''] = record.split('\x1f');
      return { hash, subject, body };
    });
}

const [command, ...args] = process.argv.slice(2);

if (command === 'next-version') {
  const [previousTag = ''] = args;
  const current = JSON.parse(readFileSync('package.json', 'utf8')).version;
  const bump = nextBump(commitsSince(previousTag));
  if (!bump) {
    console.error('no releasable commits (feat, fix, perf, revert or breaking) since ' + (previousTag || 'the start'));
    process.exit(1);
  }
  console.log(nextVersion(current, bump));
} else if (command === 'changelog') {
  const [version, previousTag = '', repoUrl] = args;
  if (!version || !repoUrl) {
    console.error('usage: changelog <version> <previousTag> <repoUrl>');
    process.exit(2);
  }
  const date = new Date().toISOString().slice(0, 10);
  process.stdout.write(
    renderChangelogEntry({ version, previousTag, date, repoUrl, commits: commitsSince(previousTag) }),
  );
} else {
  console.error('usage: release-cli.mjs next-version|changelog ...');
  process.exit(2);
}

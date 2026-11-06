# wink-elements

`@wink-travel/elements`: a TypeScript wrapper that loads the Wink CDN bundle and types the custom
elements. Source in `src/`, tests alongside as `*.test.ts` (Vitest + jsdom, coverage ≥ 80%).

## Git Workflow

Trunk-based development: `master` is the only long-lived branch.

- **Pull requests**: always target `master`. Never commit or push directly to it.
- **Commits**: Conventional Commits, lowercase subject (commitlint runs in a Husky hook). The type
  decides the release version: `feat` minor, `fix`/`perf`/`revert` patch, `!` or `BREAKING CHANGE:` major.
- **Release**: a release is a tag on `master`. Run `./release.bash` from `master` (`--dry-run` first). It
  bumps `package.json`, writes the `CHANGELOG.md` entry, commits, tags, pushes the commit and the tag
  together, and creates the GitHub release. Bamboo builds the tag and publishes to npm. See
  [bamboo-specs/README.md](./bamboo-specs/README.md).
- **Hotfixes**: fix forward on `master` and release a new patch version.
- **IMPORTANT**: never push a bare-semver tag (`MAJOR.MINOR.PATCH`) by hand: a tag on `master` publishes
  to npm. Use `./release.bash`.
- **Claude settings**: commit `.claude/` settings files as part of PRs, except `settings.local.json`.

## Verifying a change

`npm run typecheck && npm run lint && npm run test:coverage && npm run build`

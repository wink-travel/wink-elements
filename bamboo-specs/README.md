# Bamboo Specs

YAML specs for the Bamboo build plan `WP-EL` and the "Elements" deployment project that publish
`@wink-travel/elements` to npmjs.com. They are the exports of the live plan and deployment, adapted
for trunk-based releases. Same layout and conventions as `monorepo-typescript/bamboo-specs`.

## Layout

[`bamboo.yml`](./bamboo.yml) is the only spec file, on purpose: Bamboo reads YAML specs from a root
`bamboo.yml` in `bamboo-specs/` and offers no custom path. It holds four YAML documents: the plan, its
permissions, the deployment, and its permissions.

| Section    | Defines                                                                                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan       | `WP-EL`: install, check the tag equals the `package.json` version, typecheck, test, build, then `npm pack`. Publishes the tarball as the `npm package` artifact.                                          |
| Deployment | "Elements" → Production, source plan `WP-EL`, runs on build success: downloads the tarball and runs `npm publish ./*.tgz --access public`. It does not check out the repository, so the tagged commit is what ships.        |

## Releases and triggers (trunk-based)

`master` is the only long-lived branch. A release is a tag.

- `./release.bash` creates and pushes a bare-semver tag (for example `1.0.4`). The plan's trigger is
  `tag:` with `filter: '^\d+\.\d+\.\d+$'`, which matches bare semver and not the older `v1.0.3` tags or
  pre-release tags such as `1.0.4-rc1`.
- There is **no polling trigger on `master`** any more. Merges are checked by GitHub Actions
  (`.github/workflows/ci.yml`); nothing publishes on merge. semantic-release has been removed.
- A tag build checks out the **tagged commit**, not the tip of `master`. The plan fails if the tag is not
  equal to the `package.json` version (catches a tag pushed by hand) or if the tagged commit is not
  reachable from `origin/master` (a tag on an unreviewed branch must not ship).
- **`tag:` is not in the published YAML reference** (only the Java API has `TagTrigger`). Bamboo
  12.1.3 validates it and a scan applies it (verified on a throwaway plan in `monorepo-typescript`,
  including: a tag build starts within about 3 minutes since it is polling, existing tags do not build
  when the trigger first appears, `[no ci]` does not suppress a tag build, and a tag on a commit that
  is on no branch does not build). Re-run the validator after every Bamboo upgrade.

## Differences from the exports this was made from

- Plan trigger: polling every 180 s replaced by the tag trigger.
- Plan tasks: after `npm ci` it now also runs typecheck, test and build (not lint, not coverage: the repo has no eslint config yet, so `npm run lint` fails, as it does in GitHub Actions; coverage is under its 80% threshold) (the
  export ran only `npm test`), checks the tag against `package.json`, and packs the tarball.
- Deployment: the checkout, the git identity, the GitHub token and `npx semantic-release` are gone;
  it publishes the packed tarball instead. `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL` and
  `GITHUB_PRIVATE_ACCESS_KEY` are no longer used by this deployment and can be removed from the project. Delete `GITHUB_PRIVATE_ACCESS_KEY` and revoke that token on GitHub:
  the old deployment printed it in clear text in its build log.

## Secrets are not in these files

| Variable    | Where                                                    |
| ----------- | -------------------------------------------------------- |
| `NPM_TOKEN` | the "Elements" deployment project (publish scope; read as `$bamboo_NPM_TOKEN`, never inline, so it stays out of the build log) |

## If a publish fails with `401` / `EINVALIDNPMTOKEN`

`NPM_TOKEN` is expired or revoked (granular npm tokens have a maximum lifetime). Create a new granular
token with publish access to `@wink-travel/elements`, update the variable on the deployment project, and
re-run the deployment. Never paste a token inline in a script: Bamboo prints `${bamboo.X}` substitutions
in the build log.

## Enabling Repository Stored Specs

**Checking this file in does not make it authoritative.** Until the linked repository ("wink-elements") is configured to scan it, the plan stays as configured in the UI, and once it is, a push to
the tracked branch can reconfigure the live plan on the next scan. Do this deliberately.

1. Check that `NPM_TOKEN` is a masked variable on the deployment project.
2. In Bamboo, **Specs** in the top navigation, pick the linked repository, paste `bamboo.yml`,
   **Validate**. Do this before every scan.
3. Enable Bamboo Specs on the linked repository (tracking `master`; change the branch in its settings from `main` if it still says so) and **scan**.
4. **Know what the first scan does:** it removes the polling trigger and installs the tag trigger.
   Right after it, open the plan's build history: no build should have started for the existing tags
   (they are `v`-prefixed and do not match the filter), and nothing should have been published.
5. Cut the first release with `./release.bash --dry-run`, then `./release.bash`, and watch the plan.

**A scan is not automatic.** A commit does not trigger a scan: scan by hand after every merge that
touches `bamboo.yml`, or have a webhook call Bamboo on each commit.

#!/bin/bash

#
# Copyright (c) wink.travel 2026
#
# Trunk-based release. `main` is the only long-lived branch; a release is a tag on it.
#
#   ./release.bash             # interactive: shows the next version, asks, then releases
#   ./release.bash --dry-run   # compute and print everything, change nothing
#   ./release.bash --yes       # no confirmation prompt
#
# What it does, in order: checks the working tree and that local main equals origin/main, works out
# the next version from the conventional commits since the latest release tag, bumps package.json
# and writes the CHANGELOG.md entry in ONE commit (message ends in "[no ci]"), tags that commit with
# the bare version (for example 1.0.4), and pushes the commit and the tag together. Pushing the tag
# is what makes Bamboo build the package and publish it to npm. It then creates the GitHub release.
#
# It never merges, never creates a release branch and never touches any other branch. If it fails
# before the push, nothing has left your machine: see the recovery message it prints.
#
# Needs: git, gh, node + `npm ci`.
#
# RELEASE_BRANCH overrides the branch it releases from (default: main), so the script can be
# dry-run from another branch.

set -euo pipefail

RELEASE_BRANCH="${RELEASE_BRANCH:-main}"
REPO_URL="https://github.com/wink-travel/wink-elements"
DRY_RUN=false
ASSUME_YES=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --yes | -y) ASSUME_YES=true ;;
    -h | --help)
      sed -n '4,22p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "ERROR: unknown argument '$arg' (try --help)." >&2
      exit 2
      ;;
  esac
done

die() {
  echo "ERROR: $*" >&2
  exit 1
}

# --- Guards ---

command -v gh > /dev/null || die "the GitHub CLI (gh) is required to create the release."
[[ -d node_modules ]] || die "dependencies are not installed. Run 'npm ci' first."

current_branch=$(git rev-parse --abbrev-ref HEAD)
[[ "$current_branch" == "$RELEASE_BRANCH" ]] ||
  die "you must be on '$RELEASE_BRANCH' to release. Currently on '$current_branch'."

[[ -z "$(git status --porcelain)" ]] ||
  die "working tree is dirty. Commit or stash your changes before releasing."

echo "==> Checking '$RELEASE_BRANCH' matches origin/$RELEASE_BRANCH..."
git fetch --quiet --tags origin
local_sha=$(git rev-parse HEAD)
remote_sha=$(git rev-parse "origin/$RELEASE_BRANCH")
if [[ "$local_sha" != "$remote_sha" ]]; then
  ahead=$(git rev-list --count "origin/$RELEASE_BRANCH..HEAD")
  behind=$(git rev-list --count "HEAD..origin/$RELEASE_BRANCH")
  die "local '$RELEASE_BRANCH' is $ahead commit(s) ahead and $behind behind origin. Releasing a commit that is not on origin would tag something nobody else has. Pull or push first."
fi

# --- Version calculation ---

# The latest bare-semver tag. Before the first trunk-based release only the old v-prefixed tags
# exist (v1.0.3), so fall back to the latest of those as the starting point.
PREV_VERSION=$(git tag --list --sort=-v:refname | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | head -n 1 || true)
if [[ -z "$PREV_VERSION" ]]; then
  PREV_VERSION=$(git tag --list --sort=-v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -n 1 || true)
fi

version_log=$(mktemp)
if ! NEXT_VERSION=$(node scripts/release-cli.mjs next-version "$PREV_VERSION" 2> "$version_log"); then
  cat "$version_log" >&2
  rm -f "$version_log"
  die "could not determine the next version."
fi
rm -f "$version_log"

if git rev-parse --verify --quiet "refs/tags/$NEXT_VERSION" > /dev/null; then
  die "tag '$NEXT_VERSION' already exists. Nothing new to release since '${PREV_VERSION:-the start}'?"
fi

echo ""
echo "Previous version: ${PREV_VERSION:-none}"
echo "Next version:     ${NEXT_VERSION}"
echo "Commits since the previous version:"
if [[ -n "$PREV_VERSION" ]]; then
  git --no-pager log --oneline "${PREV_VERSION}..HEAD" | sed 's/^/  /'
else
  git --no-pager log --oneline | sed 's/^/  /'
fi
echo ""

if [[ "$DRY_RUN" == true ]]; then
  echo "==> Dry run: nothing was changed. A real run would now:"
  echo "      bump package.json to ${NEXT_VERSION}, add the CHANGELOG.md entry, commit, tag ${NEXT_VERSION},"
  echo "      push '${RELEASE_BRANCH}' + tag ${NEXT_VERSION} together, create the GitHub release."
  exit 0
fi

if [[ "$ASSUME_YES" != true ]]; then
  read -rp "Release ${NEXT_VERSION} from '${RELEASE_BRANCH}'? Pushing the tag publishes to npm. [y/N] " confirm
  [[ "$confirm" == "y" || "$confirm" == "Y" ]] || {
    echo "Release aborted."
    exit 0
  }
fi

# --- Recovery message if anything fails before the push ---

pushed=false
on_failure() {
  local code=$?
  if [[ "$pushed" == false ]]; then
    echo "" >&2
    echo "RELEASE FAILED before anything was pushed. Nothing left your machine." >&2
    echo "Undo the local changes with:" >&2
    echo "  git tag -d ${NEXT_VERSION} 2> /dev/null; git reset --hard origin/${RELEASE_BRANCH}" >&2
  else
    echo "" >&2
    echo "RELEASE FAILED after the push. The tag and commit are on origin." >&2
    echo "Create the GitHub release by hand: gh release create ${NEXT_VERSION} --target ${RELEASE_BRANCH} --latest" >&2
  fi
  exit "$code"
}
trap on_failure ERR

# --- Release tasks ---

echo "==> Bumping version to ${NEXT_VERSION}..."
npm version "$NEXT_VERSION" --no-git-tag-version

echo "==> Generating changelog..."
entry=$(mktemp)
node scripts/release-cli.mjs changelog "$NEXT_VERSION" "$PREV_VERSION" "$REPO_URL" > "$entry"
{ cat "$entry"; echo; cat CHANGELOG.md; } > CHANGELOG.md.new
mv CHANGELOG.md.new CHANGELOG.md

echo "==> Committing release artifacts..."
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): ${NEXT_VERSION} [no ci]"

echo "==> Tagging ${NEXT_VERSION}..."
git tag -a "$NEXT_VERSION" -m "$NEXT_VERSION"

# --- Push the release commit and the tag together ---

# --atomic: either both refs update or neither does, so a rejected branch push cannot leave a tag
# on origin that points at a commit the branch does not contain.
echo "==> Pushing '${RELEASE_BRANCH}' and tag ${NEXT_VERSION} to origin..."
git push --atomic origin "$RELEASE_BRANCH" "refs/tags/${NEXT_VERSION}"
pushed=true

# --- GitHub release ---

# The release notes are the entry just written to the changelog.
echo "==> Creating GitHub release..."
gh release create "$NEXT_VERSION" -F "$entry" --target "$RELEASE_BRANCH" --latest
rm -f "$entry"

echo "==> Release ${NEXT_VERSION} SUCCESSFUL"

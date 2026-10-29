#!/usr/bin/env bash
# Import a new openobserve/browser-sdk revision and merge it into main.
#
#   scripts/fork/sync-upstream.sh [<ref>]     (tag, branch or commit; default: main)
#
# How it works:
#   * The `upstream` branch holds one commit per import: the upstream tree with the paths
#     in drop.txt removed and the rebrand codemod applied. Nothing else is ever committed
#     there, so it is a clean, rebranded mirror of upstream.
#   * Paths listed in keep-ours.txt are frozen on `upstream` (taken from the previous import),
#     so they never conflict with the versions maintained on main.
#   * A `sync/upstream-<sha>` branch is created from main and `upstream` is merged into it.
#     Git's three-way merge carries our own changes forward. Resolve conflicts if any, run
#     the checks, push the branch and open a pull request.
set -euo pipefail

REF="${1:-main}"
UPSTREAM_URL="https://github.com/openobserve/browser-sdk"
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean" >&2
  exit 1
fi

MAIN_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
TOOLS="$(mktemp -d)"
SRC="$(mktemp -d)"
trap 'rm -rf "$TOOLS" "$SRC"' EXIT
cp -R scripts/fork/. "$TOOLS/"
FORK_VERSION="$(node -p "require('./lerna.json').version")"

echo "Fetching ${UPSTREAM_URL} ${REF}"
git clone --quiet --filter=blob:none "$UPSTREAM_URL" "$SRC"
git -C "$SRC" checkout --quiet "$REF"
SHA="$(git -C "$SRC" rev-parse HEAD)"
SHORT="${SHA:0:8}"

read_list() {
  grep -v '^[[:space:]]*#' "$1" | sed '/^[[:space:]]*$/d'
}

# ---- 1. Build the import commit on `upstream` ---------------------------------------------
if git show-ref --verify --quiet refs/heads/upstream; then
  git checkout --quiet upstream
  FIRST_IMPORT=0
else
  git checkout --quiet --orphan upstream
  FIRST_IMPORT=1
fi

git rm -rq --cached . >/dev/null 2>&1 || true
find . -mindepth 1 -maxdepth 1 ! -name .git ! -name node_modules -exec rm -rf {} +
git -C "$SRC" archive HEAD | tar -x

read_list "$TOOLS/drop.txt" | while read -r path; do rm -rf "$path"; done
find . -path ./.git -prune -o \( -name AGENTS.md -o -name CLAUDE.md \) -type f -print0 | xargs -0 rm -f

if [ "$FIRST_IMPORT" = 1 ]; then
  node -e "const f='lerna.json';const l=require('./'+f);l.version='$FORK_VERSION';require('fs').writeFileSync(f,JSON.stringify(l,null,2)+'\n')"
else
  read_list "$TOOLS/keep-ours.txt" | while read -r path; do
    if git cat-file -e "HEAD:$path" 2>/dev/null; then
      rm -rf "$path"
      git checkout --quiet HEAD -- "$path"
    fi
  done
fi

# Stage everything (some upstream files are matched by .gitignore but tracked upstream), then
# scrub and rebrand the staged tree.
git add -A -f -- . ":!node_modules"
node "$TOOLS/scrub.mjs"
node "$TOOLS/rebrand.mjs"
# Renames change line lengths; reformat so main does not carry formatting-only diffs.
PRETTIER_VERSION="$(node -p "require('./package.json').devDependencies.prettier")"
npx --yes "prettier@${PRETTIER_VERSION}" --write --log-level warn .
git add -A -f -- . ":!node_modules"

if git diff --cached --quiet; then
  echo "upstream is already at ${SHORT}"
else
  git commit --quiet -m "Import openobserve/browser-sdk ${SHORT}" -m "Upstream: ${UPSTREAM_URL}/commit/${SHA}"
  echo "Imported ${SHORT} on branch upstream"
fi

# ---- 2. Merge it into a sync branch from main ---------------------------------------------
git checkout --quiet "$MAIN_BRANCH"
if [ "$FIRST_IMPORT" = 1 ]; then
  echo "First import done. Build main on top of the upstream branch."
  exit 0
fi

SYNC_BRANCH="sync/upstream-${SHORT}"
git checkout --quiet -B "$SYNC_BRANCH"
if ! git merge --no-edit -m "Merge openobserve/browser-sdk ${SHORT}" upstream; then
  # The lockfile is regenerated rather than merged.
  if git diff --name-only --diff-filter=U | grep -qx yarn.lock; then
    git checkout --ours yarn.lock
    yarn install
    git add yarn.lock
  fi
  if [ -n "$(git diff --name-only --diff-filter=U)" ]; then
    echo
    echo "Merge conflicts to resolve:"
    git diff --name-only --diff-filter=U
    echo "Resolve them, then: git commit && yarn install && yarn typecheck && yarn build && yarn test:unit"
    exit 1
  fi
  git commit --no-edit --quiet
fi

yarn install
git add yarn.lock
git diff --cached --quiet || git commit --quiet -m "Update yarn.lock"

echo
echo "Branch ${SYNC_BRANCH} is ready. Next: yarn typecheck && yarn lint && yarn build && yarn test:unit,"
echo "then git push -u origin upstream ${SYNC_BRANCH} and open a pull request."

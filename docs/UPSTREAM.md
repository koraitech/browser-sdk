# Upstream sync

This SDK is generated from [openobserve/browser-sdk](https://github.com/openobserve/browser-sdk),
which is itself a fork of [DataDog/browser-sdk](https://github.com/DataDog/browser-sdk). Basing
on the OpenObserve fork keeps the wire format identical to what the OpenObserve backend ingests.

## Branches

- `upstream`: one commit per import. Each is the upstream tree with `scripts/fork/drop.txt`
  removed, `scripts/fork/scrub.mjs` and `scripts/fork/rebrand.mjs` applied and Prettier run.
  Nothing else is committed there.
- `main`: `upstream` plus our own changes. Imports are merged in, so Git carries our changes
  forward with a normal three-way merge.

## Tooling (`scripts/fork`)

| File               | Purpose                                                                             |
| ------------------ | ----------------------------------------------------------------------------------- |
| `brand.json`       | npm scope, API/global/bundle names, repository. All rename rules derive from it     |
| `rebrand.mjs`      | Applies the renames to every tracked file and pins package versions to `lerna.json` |
| `scrub.mjs`        | Strips editor/assistant tooling references from imported files                      |
| `drop.txt`         | Upstream paths that are never imported                                              |
| `keep-ours.txt`    | Files owned by this fork; frozen on `upstream` so they never conflict               |
| `sync-upstream.sh` | Runs the import and prepares the merge branch                                       |

## Syncing

```bash
scripts/fork/sync-upstream.sh v0.5.0     # tag, branch or commit of openobserve/browser-sdk
yarn typecheck && yarn lint && yarn build && yarn test:unit
git push -u origin upstream sync/upstream-<sha>
```

Open a pull request from `sync/upstream-<sha>` to `main`. If the merge stops on conflicts, the
script lists them; `yarn.lock` is always regenerated rather than merged.

Read the upstream changelog before syncing: OpenObserve occasionally renames wire-format keys
(for example `_oo` → `_o2` in 0.4.x), which must match the OpenObserve server version you send
data to.

## Watching for changes

`.github/workflows/upstream-watch.yml` runs `scripts/fork/check-upstream.mjs` every Monday (or on
demand from the Actions tab). It compares the OpenObserve commit recorded by the last import on
`upstream` with OpenObserve's default branch, and the Datadog release that commit is based on
(`scripts/openobserve/UPSTREAM_BASE` upstream) with the latest Datadog release. Differences are
kept in one open issue labelled `upstream-sync`, with the new OpenObserve commits and the public
changes of each newer Datadog release. The issue is updated, with a comment, when something new
appears, and closed once the import is pushed to `upstream` and both are caught up.

Run `node scripts/fork/check-upstream.mjs --dry-run` to print the same report locally.

Datadog changes arrive through OpenObserve: the report says when OpenObserve has moved to a newer
Datadog base. Until then, a Datadog fix that matters can be ported by hand on `main`.

## Changing the brand

Edit `scripts/fork/brand.json`, then re-import the current upstream revision onto a fresh
`upstream` branch (delete the local `upstream` branch first) and rebuild `main` on top of it.

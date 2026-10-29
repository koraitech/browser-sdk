# Releasing

Releases are published from GitHub Actions (`.github/workflows/release.yml`) when a version tag
is pushed.

## One-time setup

1. Create the npm organization for the package scope (`korai` in `scripts/fork/brand.json`)
   on npmjs.com.
2. Create a granular npm access token with read/write access to that scope and store it as the
   `NPM_TOKEN` secret of a GitHub environment named `npm`
   (Settings → Environments → New environment). Add required reviewers to that environment if
   releases should be approved by hand.
3. After the first release, every package exists on npm: configure **Trusted publishing** for
   each package (npmjs.com → package → Settings → Trusted publisher → GitHub Actions, workflow
   `release.yml`, environment `npm`), then delete the `NPM_TOKEN` secret. Yarn picks up the
   OIDC token automatically when no auth token is set.

## Cutting a release

```bash
# 1. Bump the version everywhere (lerna.json is the source of truth)
node -e "const f='lerna.json';const l=require('./'+f);l.version='0.2.0';require('fs').writeFileSync(f,JSON.stringify(l,null,2)+'\n')"
node scripts/fork/rebrand.mjs        # propagates the version to every package.json
yarn install                         # refreshes yarn.lock

# 2. Update CHANGELOG.md, commit, tag and push
git commit -am "Release 0.2.0"
git tag v0.2.0
git push origin main v0.2.0
```

The workflow checks that the tag matches `lerna.json`, runs typecheck, build and unit tests,
publishes the packages below in dependency order with npm provenance, and creates a GitHub
release with the bundle folders attached:

`@koraitech/js-core`, `@koraitech/browser-core`, `@koraitech/browser-worker`, `@koraitech/browser-rum-core`,
`@koraitech/browser-rum`, `@koraitech/browser-rum-slim`, `@koraitech/browser-logs`.

A tag with a pre-release suffix (`v0.2.0-beta.1`) is published under the `next` dist-tag and
marked as a pre-release on GitHub. Re-running a failed workflow is safe: already published
versions are skipped.

`BUILD_MODE=release` is what makes the bundles report the real version as `sdk_version`; a
local `yarn build` reports `dev`.

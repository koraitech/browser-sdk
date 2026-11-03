#!/usr/bin/env node
// Report what changed upstream since the last import.
//
//   node scripts/fork/check-upstream.mjs [--dry-run]
//
// Compares the openobserve/browser-sdk revision recorded on the `upstream` branch with
// OpenObserve's default branch, and the Datadog version that revision is based on with the
// latest DataDog/browser-sdk release. The result is kept in a single open issue labelled
// `upstream-sync`: created when changes appear, updated (with a comment) when something new
// shows up, and closed once both upstreams are fully imported.
//
// Needs git, and gh with GH_TOKEN (issues: write) unless --dry-run, which prints the report.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const O2_REPO = 'openobserve/browser-sdk'
const DD_REPO = 'DataDog/browser-sdk'
const LABEL = 'upstream-sync'
const MAX_COMMITS = 100
const MAX_BODY = 60000

const dryRun = process.argv.includes('--dry-run')
const { repository } = JSON.parse(readFileSync(new URL('./brand.json', import.meta.url), 'utf8'))

const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', ...opts }).trim()
const git = (...args) => run('git', args)
const gh = (...args) => run('gh', args)
const short = (sha) => sha.slice(0, 8)

async function raw(repo, ref, path) {
  const res = await fetch(`https://raw.githubusercontent.com/${repo}/${ref}/${path}`)
  if (!res.ok) {
    throw new Error(`GET ${repo}@${ref}:${path} -> ${res.status}`)
  }
  return res.text()
}

function parseVersion(tag) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(tag)
  return m ? m.slice(1).map(Number) : undefined
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return 0
}

function releaseTags(repo) {
  return git('ls-remote', '--tags', '--refs', `https://github.com/${repo}`)
    .split('\n')
    .map((line) => line.split('refs/tags/')[1])
    .filter((tag) => tag && parseVersion(tag))
    .sort((a, b) => compareVersions(parseVersion(a), parseVersion(b)))
}

// ---- Our base: the revision recorded by the last import on `upstream` ----------------------
git('fetch', '--quiet', 'origin', 'upstream')
const importMessage = git('log', '-1', '--format=%B', 'FETCH_HEAD')
const baseSha = /openobserve\/browser-sdk\/commit\/([0-9a-f]{40})/.exec(importMessage)?.[1]
if (!baseSha) {
  throw new Error(`Cannot find the upstream commit in the last import message:\n${importMessage}`)
}

// ---- OpenObserve ---------------------------------------------------------------------------
const o2Dir = mkdtempSync(join(tmpdir(), 'o2-'))
let o2
try {
  git('clone', '--quiet', '--filter=blob:none', '--no-checkout', `https://github.com/${O2_REPO}`, o2Dir)
  const o2Git = (...args) => run('git', ['-C', o2Dir, ...args])
  const branch = o2Git('rev-parse', '--abbrev-ref', 'origin/HEAD').replace(/^origin\//, '')
  const headSha = o2Git('rev-parse', 'origin/HEAD')
  const log = o2Git('log', '--no-merges', '--format=%H%x09%as%x09%an%x09%s', `${baseSha}..${headSha}`)
  const commits = log
    ? log.split('\n').map((line) => {
        const [sha, date, author, subject] = line.split('\t')
        return { sha, date, author, subject }
      })
    : []
  const version = (sha) => JSON.parse(o2Git('show', `${sha}:lerna.json`)).version
  // OpenObserve records the Datadog release each revision is merged up to.
  const ddBase = (sha) => {
    try {
      return o2Git('show', `${sha}:scripts/openobserve/UPSTREAM_BASE`)
    } catch {
      throw new Error(`${O2_REPO}@${short(sha)} has no scripts/openobserve/UPSTREAM_BASE; update this script`)
    }
  }
  o2 = {
    branch,
    headSha,
    commits,
    baseVersion: version(baseSha),
    headVersion: version(headSha),
    baseDd: ddBase(baseSha),
    headDd: ddBase(headSha),
    tags: releaseTags(O2_REPO),
  }
} finally {
  rmSync(o2Dir, { recursive: true, force: true })
}

// ---- Datadog -------------------------------------------------------------------------------
const ddTags = releaseTags(DD_REPO)
const ddLatest = ddTags.at(-1)
const ddNewer = ddTags.filter((tag) => compareVersions(parseVersion(tag), parseVersion(o2.baseDd)) > 0).reverse()

// Public changes of each release newer than our base, from Datadog's generated changelog.
const ddNotes = new Map()
if (ddNewer.length) {
  const changelog = await raw(DD_REPO, ddLatest, 'CHANGELOG.md')
  for (const section of changelog.split(/^## /m).slice(1)) {
    const [heading, ...rest] = section.split('\n')
    if (!ddNewer.includes(heading.trim())) continue
    const text = rest.join('\n')
    const pub = /\*\*Public Changes:\*\*\n([\s\S]*?)(?=\n\*\*|$)/.exec(text)?.[1].trim()
    ddNotes.set(heading.trim(), pub || '_No public changes._')
  }
}

// ---- Report --------------------------------------------------------------------------------
const o2Url = `https://github.com/${O2_REPO}`
const ddUrl = `https://github.com/${DD_REPO}`
const newO2Tags = o2.tags.filter((tag) => compareVersions(parseVersion(tag), parseVersion(o2.baseVersion)) > 0)
const state = { o2: o2.headSha, dd: ddLatest }
const hasChanges = o2.commits.length > 0 || ddNewer.length > 0

const lines = [
  `<!-- upstream-watch ${JSON.stringify(state)} -->`,
  `Checked ${new Date().toISOString().slice(0, 10)}.`,
  '',
  '| Upstream | Imported | Latest | Gap |',
  '| --- | --- | --- | --- |',
  `| [OpenObserve](${o2Url}) | [\`${short(baseSha)}\`](${o2Url}/commit/${baseSha}) (${o2.baseVersion}) | [\`${short(o2.headSha)}\`](${o2Url}/commit/${o2.headSha}) on \`${o2.branch}\` (${o2.headVersion}) | ${o2.commits.length} commit(s)${newO2Tags.length ? `, tags ${newO2Tags.join(', ')}` : ''} |`,
  `| [Datadog](${ddUrl}) | ${o2.baseDd} (via OpenObserve) | [${ddLatest}](${ddUrl}/releases/tag/${ddLatest}) | ${ddNewer.length} release(s) |`,
  '',
]

if (o2.headDd !== o2.baseDd) {
  lines.push(
    `OpenObserve \`${o2.branch}\` has moved its Datadog base to **${o2.headDd}**, so the next import brings those Datadog changes too.`,
    ''
  )
} else if (ddNewer.length) {
  lines.push(
    `OpenObserve \`${o2.branch}\` is still on Datadog ${o2.headDd}. Datadog changes reach this SDK once OpenObserve merges them, or by porting individual fixes.`,
    ''
  )
}

if (o2.commits.length) {
  lines.push(`### OpenObserve commits since \`${short(baseSha)}\``, '')
  for (const c of o2.commits.slice(0, MAX_COMMITS)) {
    lines.push(`- [\`${short(c.sha)}\`](${o2Url}/commit/${c.sha}) ${c.date} ${c.subject} (${c.author})`)
  }
  if (o2.commits.length > MAX_COMMITS) {
    lines.push(`- ... and ${o2.commits.length - MAX_COMMITS} more: ${o2Url}/compare/${baseSha}...${o2.headSha}`)
  }
  lines.push('')
}

if (ddNewer.length) {
  lines.push(`### Datadog releases after ${o2.baseDd}`, '')
  lines.push(`Public changes only; full notes in the [changelog](${ddUrl}/blob/${ddLatest}/CHANGELOG.md).`, '')
  for (const tag of ddNewer) {
    lines.push(
      `<details><summary><b>${tag}</b></summary>`,
      '',
      ddNotes.get(tag) ?? '_Not in the changelog._',
      '',
      '</details>',
      ''
    )
  }
}

lines.push(
  '### Syncing',
  '',
  `Read the OpenObserve changes for wire-format renames first, then follow [docs/UPSTREAM.md](https://github.com/${repository}/blob/main/docs/UPSTREAM.md):`,
  '',
  '```bash',
  `scripts/fork/sync-upstream.sh ${newO2Tags.at(-1) ?? short(o2.headSha)}`,
  '```',
  '',
  'This issue closes itself once the import is merged to `upstream` and both upstreams are caught up.'
)

let body = lines.join('\n')
if (body.length > MAX_BODY) {
  body = `${body.slice(0, MAX_BODY)}\n\n_Truncated._`
}
const title = `Upstream changes: ${[
  o2.commits.length && `OpenObserve +${o2.commits.length} commits`,
  ddNewer.length && `Datadog ${o2.baseDd} -> ${ddLatest}`,
]
  .filter(Boolean)
  .join(', ')}`

if (dryRun) {
  console.log(`${title}\n\n${body}`)
  process.exit(0)
}

// ---- Keep one tracking issue in sync -------------------------------------------------------
gh('label', 'create', LABEL, '--color', '0e8a16', '--description', 'Changes available in upstream SDKs', '--force')
const open = JSON.parse(
  gh('issue', 'list', '--label', LABEL, '--state', 'open', '--json', 'number,body', '--limit', '1')
)[0]
const previous = open && JSON.parse(/<!-- upstream-watch (.*?) -->/.exec(open.body)?.[1] ?? '{}')

if (!hasChanges) {
  if (open) {
    gh('issue', 'close', String(open.number), '--reason', 'completed', '--comment', 'Both upstreams are imported.')
  }
  console.log('Up to date with both upstreams.')
} else if (!open) {
  const url = gh('issue', 'create', '--title', title, '--label', LABEL, '--body-file', '-', { input: body })
  console.log(`Opened ${url}`)
} else if (previous.o2 !== state.o2 || previous.dd !== state.dd) {
  gh('issue', 'edit', String(open.number), '--title', title, '--body-file', '-', { input: body })
  const news = []
  if (previous.o2 !== state.o2) news.push(`OpenObserve \`${o2.branch}\` moved to \`${short(o2.headSha)}\``)
  if (previous.dd !== state.dd) news.push(`Datadog released ${ddLatest}`)
  gh('issue', 'comment', String(open.number), '--body', `${news.join('; ')}. Summary above is updated.`)
  console.log(`Updated #${open.number}`)
} else {
  console.log(`Nothing new since #${open.number}.`)
}

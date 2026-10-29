#!/usr/bin/env node
/**
 * Rebrand codemod.
 *
 * Turns a pristine openobserve/browser-sdk tree into this fork by applying rename rules
 * derived from scripts/fork/brand.json to every tracked text file, then pinning every
 * workspace package to the fork version.
 *
 * Only the public identity changes: npm package names, exported API names, window
 * globals, CDN bundle file names, the console prefix and repository URLs. The wire
 * format stays byte-compatible with the OpenObserve ingestion API.
 *
 * Run from the repository root:
 *   node scripts/fork/rebrand.mjs [--check]
 *
 * --check: exit 1 if any file WOULD change.
 *
 * Deterministic and idempotent: running it twice produces the same tree.
 */
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = process.cwd()
const HERE = path.dirname(fileURLToPath(import.meta.url))
const CHECK = process.argv.includes('--check')

const brand = JSON.parse(fs.readFileSync(path.join(HERE, 'brand.json'), 'utf8'))
const SCOPE = `@${brand.npmScope}/`

// Tokens that contain a source brand but must survive verbatim (the event schema package
// is a dev-only dependency resolved from git, not something we publish).
const PROTECTED = ['@openobserve/rum-events-format', 'openobserve/rum-events-format']

// Ordered: specific rules before rules that match a substring of them.
const rules = [
  { literal: '@openobserve/browser-', to: `${SCOPE}browser-` },
  { literal: '@openobserve/js-core', to: `${SCOPE}js-core` },
  { literal: "'@openobserve/*'", to: `'${SCOPE}*'` },
  { literal: 'github.com/openobserve/browser-sdk', to: `github.com/${brand.repository}` },
  { literal: 'openobserveRum', to: `${brand.apiPrefix}Rum` },
  { literal: 'openobserveLogs', to: `${brand.apiPrefix}Logs` },
  { regex: '\\bO2_RUM\\b', to: `${brand.globalPrefix}_RUM` },
  { regex: '\\bO2_LOGS\\b', to: `${brand.globalPrefix}_LOGS` },
  { regex: '\\bopenobserve-(rum|logs)', to: `${brand.bundlePrefix}-$1` },
  { literal: 'OpenObserve Browser SDK', to: `${brand.displayName} Browser SDK` },
].map((rule) => ({ ...rule, matcher: rule.regex ? new RegExp(rule.regex, 'g') : null }))

const keepOurs = fs
  .readFileSync(path.join(HERE, 'keep-ours.txt'), 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))

const SKIP = [/^\.yarn\//, /^yarn\.lock$/, /^LICENSE/, /\.(png|jpg|jpeg|gif|ico|woff2?|ttf|eot|mp4|webm|zip|jar|pdf)$/i]

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 })
  .toString('utf8')
  .split('\0')
  .filter(Boolean)
  .filter((f) => !SKIP.some((re) => re.test(f)))
  .filter((f) => !keepOurs.some((p) => f === p || f.startsWith(`${p}/`)))

// Apache-2.0 §4: upstream attribution lines (per-file license headers, copyright lines)
// are never rewritten.
const ATTRIBUTION_RE = /software developed at Datadog|Copyright\b[^\n]*\b(Datadog|OpenObserve), Inc\./

function applyRules(content) {
  return content
    .split('\n')
    .map((line) => {
      if (ATTRIBUTION_RE.test(line)) return line
      let out = line
      PROTECTED.forEach((token, i) => (out = out.split(token).join(`\u0000${i}\u0000`)))
      for (const rule of rules) {
        out = rule.matcher ? out.replace(rule.matcher, rule.to) : out.split(rule.literal).join(rule.to)
      }
      PROTECTED.forEach((token, i) => (out = out.split(`\u0000${i}\u0000`).join(token)))
      return out
    })
    .join('\n')
}

let changed = 0
for (const file of trackedFiles) {
  const abs = path.join(ROOT, file)
  if (!fs.existsSync(abs) || !fs.lstatSync(abs).isFile()) continue
  const buf = fs.readFileSync(abs)
  if (buf.includes(0)) continue
  const content = buf.toString('utf8')
  const next = applyRules(content)
  if (next !== content) {
    changed++
    if (!CHECK) fs.writeFileSync(abs, next)
  }
}

// ---- Version normalization -------------------------------------------------
// The root package.json version is baked into the bundles as the reported SDK version,
// so it follows the fork version together with the workspace packages.
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'lerna.json'), 'utf8')).version
let versionChanged = 0
for (const file of trackedFiles.filter((f) => f.endsWith('package.json'))) {
  const abs = path.join(ROOT, file)
  if (!fs.existsSync(abs)) continue
  const pkg = JSON.parse(fs.readFileSync(abs, 'utf8'))
  let touched = false
  const isOurs = file === 'package.json' || (typeof pkg.name === 'string' && pkg.name.startsWith(SCOPE))
  if (pkg.version && isOurs && pkg.version !== VERSION) {
    pkg.version = VERSION
    touched = true
  }
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const dep of Object.keys(pkg[section] || {})) {
      if (dep.startsWith(SCOPE) && /^\d/.test(pkg[section][dep]) && pkg[section][dep] !== VERSION) {
        pkg[section][dep] = VERSION
        touched = true
      }
    }
  }
  if (touched) {
    versionChanged++
    if (!CHECK) fs.writeFileSync(abs, `${JSON.stringify(pkg, null, 2)}\n`)
  }
}

console.log(`rebrand: ${changed} files rebranded, ${versionChanged} package.json versions set to ${VERSION}`)
if (CHECK && changed + versionChanged > 0) {
  console.error('rebrand --check: tree is not fully branded')
  process.exit(1)
}

#!/usr/bin/env node
/**
 * Removes editor/assistant tooling references from an imported upstream tree.
 * Run from the repository root after the paths in drop.txt are deleted. Fails if any
 * reference is left, so a new one upstream is noticed instead of being imported silently.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const edits = {
  '.gitignore': (s) => s.replace(/^# Claude Code local files\n/m, '').replace(/^\.claude\/.*\n/gm, ''),
  'eslint.config.ts': (s) => s.replace(/^.*'\.claude\/worktrees',\n/m, ''),
  'docs/TESTING.md': (s) => s.replace(/## Test my change using Claude Code agent\n[\s\S]*?(?=\n## )\n/, ''),
  '.github/PULL_REQUEST_TEMPLATE.md': (s) => s.replace(' (ex: AI agent generated)', ''),
}

for (const [file, edit] of Object.entries(edits)) {
  if (fs.existsSync(file)) {
    fs.writeFileSync(file, edit(fs.readFileSync(file, 'utf8')))
  }
}

let leftovers = ''
try {
  leftovers = execFileSync('git', ['grep', '-n', '-i', '-I', '-E', 'claude|anthropic', '--', '.', ':!.yarn'], {
    encoding: 'utf8',
  })
} catch {
  // git grep exits 1 when nothing matches
}
if (leftovers) {
  console.error(`scrub: references left, extend scripts/fork/scrub.mjs:\n${leftovers}`)
  process.exit(1)
}

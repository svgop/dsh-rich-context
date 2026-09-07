/**
 * dsh-rich-context — Host half.
 *
 * Owns the AGENTS.md management service on the host plane:
 *  - GET  /api/rich-context/state            (workspaces, file contents, templates)
 *  - PUT  /api/rich-context/file             (scope: global | workspace)
 *  - PUT  /api/rich-context/template         (create/update a user template)
 *  - DELETE /api/rich-context/template       (remove a user template)
 *
 * The files managed are exactly what dsh-agent-instructions loads:
 *  - user-global: <DSH_HOME>/AGENTS.md          (injected into every session)
 *  - workspace:   <workspace-root>/AGENTS.md    (per-project, cwd-discovered)
 *
 * Zero runtime dependencies: node builtins only.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync, lstatSync, symlinkSync, readlinkSync, rmdirSync, statSync as statSyncNode } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname, basename } from 'node:path'
import { homedir } from 'node:os'
import { randomUUID } from 'node:crypto'

const API_PREFIX = '/api/rich-context'
const ACTION_LIMIT = 2_000_000
const DSH_HOME = process.env.DSH_HOME ?? join(homedir(), '.dsh')
const GLOBAL_FILE = join(DSH_HOME, 'AGENTS.md')
const TEMPLATE_DIR = join(DSH_HOME, 'rich-context', 'templates')
/**
 * Prompts live as NATIVE user skills in $DSH_HOME/skills — the same root the
 * harness's own skill-filesystem provider scans (source 'user-dsh', flat
 * <slug>.md with name+description frontmatter). One library, two consumption
 * paths: @name inserts the body in the composer, and every agent discovers
 * the prompt as a real skill through the native catalog.
 */
const SKILLS_DIR = join(DSH_HOME, 'skills')
/** Pre-alignment store (v0.7.x): migrated into the skills root on first touch. */
const LEGACY_PROMPT_DIR = join(DSH_HOME, 'rich-context', 'prompts')
const SESSIONS_DIR = join(DSH_HOME, 'sessions')
/** Known tool directories that use AGENTS.md — scanned on demand. */
const KNOWN_SOURCES = [
  { dir: '.dsh', label: 'DSH Harness' },
  { dir: '.codex', label: 'Codex CLI' },
  { dir: '.claude', label: 'Claude Code' },
  { dir: '.omp', label: 'OMP' },
  { dir: '.pi', label: 'Pi' },
  { dir: '.cursor', label: 'Cursor' },
  { dir: '.aider', label: 'Aider' },
  { dir: '.gemini', label: 'Gemini' },
  { dir: '.copilot', label: 'Copilot' },
  { dir: '.continue', label: 'Continue' },
]

export const name = 'dsh-rich-context'
export const inject = ['tools', 'webServer']

/** Built-in section templates (insertable titled sections, always available). */
const BUILTIN_TEMPLATES = [
  {
    id: 'builtin:coding-standards',
    name: 'Coding standards',
    section: `## Coding standards

- Prefer the smallest change that solves the problem; no speculative abstraction.
- Name things after what they do, not how they're implemented.
- Every non-obvious decision gets one comment saying WHY, not WHAT.
- Match the file's existing style; do not reformat untouched code.`,
  },
  {
    id: 'builtin:review-checklist',
    name: 'Review checklist',
    section: `## Review checklist

Before claiming any change is done:
- [ ] The exact user workflow works end to end (not just the unit under test).
- [ ] Failure paths verified: invalid input, retries, partial failure, cleanup.
- [ ] No stubs, mocks, or success-shaped responses standing in for real behavior.
- [ ] Docs and comments updated where behavior changed.`,
  },
  {
    id: 'builtin:testing-policy',
    name: 'Testing policy',
    section: `## Testing policy

- Tests prove behavior, not implementation details.
- One focused test per claim; name the claim in the test title.
- Failure-path tests are as important as happy-path tests.
- Benchmarks only with a baseline comparison, same workload and environment.`,
  },
  {
    id: 'builtin:communication',
    name: 'Communication rules',
    section: `## Communication rules

- Lead with the answer or result; details after.
- Plain, direct language; no filler and no hedging.
- Report what was measured, not what was intended.
- When blocked, name the concrete blocker and what would unblock it.`,
  },
  {
    id: 'builtin:language',
    name: 'Language rule',
    section: `## Language

Reply in the language the user is currently writing in. Technical terms,
identifiers, and code stay in their original language.`,
  },
  {
    id: 'builtin:safety-rails',
    name: 'Safety rails',
    section: `## Safety rails

- Never delete or overwrite user data without an explicit instruction naming it.
- Destructive commands require confirmation unless pre-authorized this session.
- Secrets are never echoed, logged, or committed.`,
  },
  {
    id: 'builtin:commit-discipline',
    name: 'Commit discipline',
    section: `## Commit discipline

- One logical change per commit; the message says what and why.
- Never mix refactors with behavior changes.
- Commits build green: no broken intermediate states on shared branches.`,
  },
]

/** List workspace slugs from the sessions directory (each --slug-- dir is a cwd). */
function workspaceSlugs() {
  try {
    return readdirSync(SESSIONS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name.startsWith('--') && entry.name.endsWith('--'))
      .map((entry) => entry.name.slice(2, -2))
      .sort()
  } catch {
    return []
  }
}

/** Decode a sessions-dir slug back to a filesystem path. */
function slugToPath(slug) {
  const decoded = slug.replaceAll("--", "/")
  return decoded.startsWith("/") ? decoded : `/${decoded}`
}

// Workspace discovery: the sessions store is the portable truth. Each
// --slug-- project directory under $DSH_HOME/sessions holds session files
// whose first line (the header JSON) names the exact cwd. One python
// process reads them all (zstd via the zstandard module when needed); the
// slug-decode fallback below covers environments without python, with
// existsSync arbitrating its separator ambiguity.
const WORKSPACE_CACHE = { at: 0, list: [] }
const WORKSPACE_SCRIPT = [
  'import json, os, sys',
  'root = sys.argv[1]',
  'out = []',
  'def newest_header(project):',
  '    logs = []',
  '    for base, _dirs, names in os.walk(project):',
  '        for name in names:',
  '            if name.startswith("session") and (name.endswith(".jsonl") or name.endswith(".jsonl.zstd")):',
  '                p = os.path.join(base, name)',
  '                try: logs.append((os.path.getmtime(p), p))',
  '                except OSError: pass',
  '    for _mtime, path in sorted(logs, reverse=True):',
  '        try:',
  '            if path.endswith(".zstd"):',
  '                import zstandard',
  '                with open(path, "rb") as fh: raw = zstandard.ZstdDecompressor().stream_reader(fh).read(4096)',
  '            else:',
  '                with open(path, "rb") as fh: raw = fh.read(4096)',
  '            line = raw.split(b"\\n", 1)[0].decode("utf-8", "replace")',
  '            return json.loads(line).get("cwd")',
  '        except Exception: continue',
  '    return None',
  'try: dirs = sorted(os.listdir(root), key=lambda d: os.path.getmtime(os.path.join(root, d)), reverse=True)[:80]',
  'except OSError: dirs = []',
  'for name in dirs:',
  '    if not (name.startswith("--") and name.endswith("--")): continue',
  '    cwd = newest_header(os.path.join(root, name))',
  '    if isinstance(cwd, str) and cwd not in out: out.append(cwd)',
  'print(json.dumps(out))',
].join('\n')

/** Newest-first workspace cwds straight from session headers (60s cache). */
function workspacesFromSessionHeaders() {
  if (Date.now() - WORKSPACE_CACHE.at < 60_000) return WORKSPACE_CACHE.list
  const root = join(DSH_HOME, 'sessions')
  let list = null
  try {
    const out = execFileSync('python', ['-c', WORKSPACE_SCRIPT, root], { encoding: 'utf8', timeout: 10_000, windowsHide: true })
    const parsed = JSON.parse(out)
    if (Array.isArray(parsed)) list = parsed.filter((entry) => typeof entry === 'string' && existsSync(entry))
  } catch {
    list = null
  }
  WORKSPACE_CACHE.list = list ?? []
  WORKSPACE_CACHE.at = Date.now()
  return WORKSPACE_CACHE.list
}

/** Reverse the session-dir slug escapes (~HEX) back to characters. */
function decodeSlugChars(slug) {
  return slug.replace(/~([0-9A-F]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
}

/** Fallback for python-less environments: decode slugs, existsSync arbitrates. */
function workspacesFromSlugs() {
  const root = join(DSH_HOME, 'sessions')
  let names = []
  try { names = readdirSync(root).filter((name) => name.startsWith('--') && name.endsWith('--')) } catch { return [] }
  const found = []
  for (const name of names.slice(0, 80)) {
    const slug = decodeSlugChars(name.slice(2, -2))
    if (slug === '' || slug === 'root') continue
    const driveLetter = /^([A-Za-z])(?=-|$)/.exec(slug)
    const posix = `/${slug.replaceAll('-', '/')}`
    const windows = driveLetter !== null ? `${driveLetter[1]}:\\${slug.slice(2).replaceAll('-', '\\')}` : null
    for (const candidate of [windows, posix]) {
      if (typeof candidate === 'string' && existsSync(candidate) && !found.includes(candidate)) { found.push(candidate); break }
    }
  }
  return found
}

/** Slug a prompt/skill file may carry (ascii kebab, bounded) — also the
 * frontmatter name we write, so the file is a valid native skill. */
const PROMPT_SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/

/** Lenient YAML-frontmatter split: {name, description, body} or null when the file has none. */
function parseSkillMarkdown(raw) {
  if (typeof raw !== 'string' || raw.startsWith('---\n') === false && raw.startsWith('---\r\n') === false) return null
  const end = raw.indexOf('\n---', raw.startsWith('---\r\n') ? 5 : 4)
  if (end === -1) return null
  const head = raw.slice(0, end)
  const body = raw.slice(raw.indexOf('\n', end + 1) + 1)
  const field = (key) => {
    const match = new RegExp(`^${key}:\\s*(.*)$`, 'm').exec(head)
    return match !== null ? match[1].trim().replace(/^["']|["']$/g, '') : undefined
  }
  return { name: field('name'), description: field('description'), body }
}

/** One native skill file: frontmatter (name + description) + body. */
function writeSkillMarkdown(slug, description, body) {
  const desc = description.trim() === '' ? deriveDescription(body) : description.trim()
  return `---\nname: ${slug}\ndescription: ${desc.replace(/\n/g, ' ')}\n---\n\n${body.replace(/\s+$/, '')}\n`
}

/** Description fallback: the first non-empty body line, bounded for frontmatter. */
function deriveDescription(body) {
  const line = body.split('\n').map((entry) => entry.trim()).find((entry) => entry !== '') ?? 'prompt'
  const clean = line.replace(/^#+\s*/, '').replace(/[*_`>#-]/g, '').trim()
  return (clean === '' ? 'prompt' : clean).slice(0, 120)
}

/**
 * One-time migration of the pre-alignment store: each legacy prompt becomes
 * a native skill (description derived from its first line), the legacy file
 * is removed after its new home is written, and the emptied directory goes.
 * Idempotent: a legacy slug that already exists as a skill is left to the skill.
 */
function migrateLegacyPrompts() {
  if (existsSync(LEGACY_PROMPT_DIR) === false) return
  let names = []
  try { names = readdirSync(LEGACY_PROMPT_DIR).filter((name) => name.endsWith('.md')) } catch { return }
  for (const name of names) {
    const slug = name.replace(/\.md$/, '')
    if (PROMPT_SLUG.test(slug) === false) continue
    const target = join(SKILLS_DIR, `${slug}.md`)
    if (existsSync(target)) { try { unlinkSync(join(LEGACY_PROMPT_DIR, name)) } catch { /* keep */ } ; continue }
    try {
      const body = readFileSync(join(LEGACY_PROMPT_DIR, name), 'utf8')
      mkdirSync(SKILLS_DIR, { recursive: true })
      writeFileSync(target, writeSkillMarkdown(slug, '', body), 'utf8')
      unlinkSync(join(LEGACY_PROMPT_DIR, name))
    } catch { /* best-effort: the legacy file stays for the next attempt */ }
  }
  try { rmdirSync(LEGACY_PROMPT_DIR) } catch { /* still has files or ENOENT */ }
}

/**
 * List prompt-skills from the native user skills root: flat <slug>.md files
 * and <dir>/SKILL.md directories (the two shapes the harness's skill
 * provider discovers). Bodies are served frontmatter-stripped so @name
 * insertion and the editor see only the prompt text.
 */
function promptFiles() {
  migrateLegacyPrompts()
  if (existsSync(SKILLS_DIR) === false) return []
  const out = []
  let entries = []
  try { entries = readdirSync(SKILLS_DIR, { withFileTypes: true }) } catch { return [] }
  for (const entry of entries) {
    let full = null
    let slug = null
    if (entry.isFile() === true && entry.name.endsWith('.md')) { slug = entry.name.replace(/\.md$/, ''); full = join(SKILLS_DIR, entry.name) }
    else if (entry.isDirectory() === true && existsSync(join(SKILLS_DIR, entry.name, 'SKILL.md'))) { slug = entry.name; full = join(SKILLS_DIR, entry.name, 'SKILL.md') }
    else continue
    const raw = readFileOrNull(full) ?? ''
    const parsed = parseSkillMarkdown(raw)
    const stat = statOf(full)
    out.push({
      slug,
      // The display name humanizes the skill's slug-form frontmatter name
      // (the catalog needs the slug form; people read the spaced form).
      name: parsed?.name && parsed.name !== '' ? parsed.name.replaceAll('-', ' ') : slug.replaceAll('-', ' '),
      description: parsed?.description ?? '',
      body: parsed !== null ? parsed.body.trim() : raw.trim(),
      size: stat?.size ?? 0,
      updatedAt: stat?.mtimeMs ?? 0,
    })
  }
  return out.sort((a, b) => a.slug < b.slug ? -1 : 1)
}

/** stat() or null; unreadable entries stay listed with zero metadata. */
function statOf(path) {
  try { return statSyncNode(path) } catch { return null }
}

function readFileOrNull(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

function userTemplates() {
  try {
    return readdirSync(TEMPLATE_DIR)
      .filter((name) => name.endsWith('.md'))
      .map((name) => ({ id: `user:${name.replace(/\.md$/, '')}`, name: name.replace(/\.md$/, '').replaceAll('-', ' '), section: readFileSync(join(TEMPLATE_DIR, name), 'utf8') }))
  } catch {
    return []
  }
}

/** Write one JSON response. */
function writeJson(res, status, body) {
  if (res.writableEnded) return
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

/** Read a bounded JSON request body. */
async function readJsonBody(req, limit) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > limit) throw new Error('body-too-large')
    chunks.push(buffer)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw === '' ? undefined : JSON.parse(raw)
}

/** Absolute on any platform: posix leading slash OR a Windows drive root. */
function isAbsoluteish(path) {
  return path.startsWith('/') || path.startsWith('\\') || /^[A-Za-z]:[\\/]/.test(path)
}

/** Route fence (exemplar posture): loopback socket + browser same-origin marker. */
function guard(req, res) {
  const remote = req.socket?.remoteAddress ?? ''
  const loopback = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1'
  const site = req.headers['sec-fetch-site']
  const browser = site === 'same-origin' || typeof req.headers.origin === 'string'
  if (!loopback || !browser) writeJson(res, 403, { ok: false, error: 'forbidden' })
  return loopback && browser
}

export function apply(ctx) {
  ctx.effect(() => {
    const routes = [
      {
        kind: 'exact',
        path: `${API_PREFIX}/state`,
        handler: (req, res) => {
          if (req.method !== 'GET') { writeJson(res, 405, { ok: false, error: 'method-not-allowed' }); return }
          if (!guard(req, res)) return
          // Workspaces as real filesystem paths — scan known parent dirs for repos
          const wsRoots = []
          for (const entry of workspacesFromSessionHeaders()) wsRoots.push(entry)
          if (wsRoots.length === 0) for (const entry of workspacesFromSlugs()) wsRoots.push(entry)
          const scanDirs = ['/home/github', '/home/sysadmin', '/tmp']
          for (const scanDir of scanDirs) {
            if (!existsSync(scanDir)) continue
            try {
              for (const entry of readdirSync(scanDir, { withFileTypes: true })) {
                if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue
                const repoDir = join(scanDir, entry.name)
                // Include if it has AGENTS.md, CLAUDE.md, or is a git repo
                if (existsSync(join(repoDir, 'AGENTS.md')) || existsSync(join(repoDir, 'CLAUDE.md')) || existsSync(join(repoDir, '.git'))) {
                  wsRoots.push(repoDir)
                }
              }
            } catch { /* not readable */ }
          }
          wsRoots.sort()
          writeJson(res, 200, {
            ok: true,
            globalPath: GLOBAL_FILE,
            globalContent: readFileOrNull(GLOBAL_FILE),
            workspaces: wsRoots,
            templates: [...BUILTIN_TEMPLATES, ...userTemplates()],
          })
        },
      },
      {
        kind: 'exact',
        path: `${API_PREFIX}/prompts`,
        handler: async (req, res) => {
          if (!guard(req, res)) return
          if (req.method === 'GET') { writeJson(res, 200, { ok: true, prompts: promptFiles() }); return }
          if (req.method !== 'POST') { writeJson(res, 405, { ok: false, error: 'method-not-allowed' }); return }
          let body
          try { body = await readJsonBody(req, 64 * 1024) } catch (error) {
            writeJson(res, 400, { ok: false, error: error?.message ?? 'bad-request' }); return
          }
          const slug = body?.slug
          if (typeof slug !== 'string' || PROMPT_SLUG.test(slug) === false) {
            writeJson(res, 400, { ok: false, error: 'prompt slug must be lowercase ascii letters, digits, and dashes (max 64)' }); return
          }
          if (body?.op === 'delete') {
            // Flat file or directory-shaped skill — remove whichever exists.
            const flat = join(SKILLS_DIR, `${slug}.md`)
            const dir = join(SKILLS_DIR, slug, 'SKILL.md')
            if (existsSync(flat)) unlinkSync(flat)
            else if (existsSync(dir)) unlinkSync(dir)
            writeJson(res, 200, { ok: true, prompts: promptFiles() }); return
          }
          if (body?.op !== 'save' || typeof body.body !== 'string' || body.body.trim() === '' || body.body.length > 32_000) {
            writeJson(res, 400, { ok: false, error: 'op=save requires a non-empty body (max 32,000 characters)' }); return
          }
          const description = typeof body.description === 'string' ? body.description.slice(0, 200) : ''
          mkdirSync(SKILLS_DIR, { recursive: true })
          writeFileSync(join(SKILLS_DIR, `${slug}.md`), writeSkillMarkdown(slug, description, body.body), 'utf8')
          writeJson(res, 200, { ok: true, prompts: promptFiles() })
        },
      },
      {
        kind: 'exact',
        path: `${API_PREFIX}/file`,
        handler: async (req, res) => {
          if (req.method !== 'GET' && req.method !== 'PUT') { writeJson(res, 405, { ok: false, error: 'method-not-allowed' }); return }
          if (!guard(req, res)) return
          if (req.method === 'GET') {
            const url = new URL(req.url ?? '/', 'http://localhost')
            const scope = url.searchParams.get('scope')
            if (scope === 'global') { writeJson(res, 200, { ok: true, path: GLOBAL_FILE, content: readFileOrNull(GLOBAL_FILE) }); return }
            if (scope === 'workspace') {
              const wsPath = url.searchParams.get('workspace') ?? ''
              if (wsPath === '' || isAbsoluteish(wsPath) === false || wsPath.includes('..')) { writeJson(res, 400, { ok: false, error: 'invalid-workspace' }); return }
              const path = join(wsPath, 'AGENTS.md')
              writeJson(res, 200, { ok: true, path, content: readFileOrNull(path) })
              return
            }
            if (scope === 'custom') {
              const customPath = url.searchParams.get('path') ?? ''
              if (customPath === '' || isAbsoluteish(customPath) === false || customPath.includes('..')) { writeJson(res, 400, { ok: false, error: 'invalid-path' }); return }
              writeJson(res, 200, { ok: true, path: customPath, content: readFileOrNull(customPath) })
              return
            }
            writeJson(res, 400, { ok: false, error: 'invalid-scope' })
            return
          }
          if (!(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) { writeJson(res, 415, { ok: false, error: 'json-required' }); return }
          let body
          try { body = await readJsonBody(req, ACTION_LIMIT) } catch (error) {
            writeJson(res, error?.message === 'body-too-large' ? 413 : 400, { ok: false, error: error?.message ?? 'bad-request' })
            return
          }
          if (typeof body !== 'object' || body === null || typeof body.content !== 'string' || (body.scope !== 'global' && body.scope !== 'workspace' && body.scope !== 'custom')) {
            writeJson(res, 400, { ok: false, error: 'invalid-body' })
            return
          }
          let path
          if (body.scope === 'custom') {
            if (typeof body.path !== 'string' || body.path === '' || isAbsoluteish(body.path) === false || body.path.includes('..')) { writeJson(res, 400, { ok: false, error: 'invalid-path' }); return }
            path = body.path
          }
          else if (body.scope === 'global') path = GLOBAL_FILE
          else {
            const wsPath = typeof body.workspace === 'string' ? body.workspace : ''
            if (wsPath === '' || isAbsoluteish(wsPath) === false || wsPath.includes('..')) { writeJson(res, 400, { ok: false, error: 'invalid-workspace' }); return }
            path = join(wsPath, 'AGENTS.md')
          }
          try {
            mkdirSync(dirname(path), { recursive: true })
            writeFileSync(path, body.content, 'utf8')
            writeJson(res, 200, { ok: true, path })
          } catch (error) {
            writeJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
          }
        },
      },
      {
        kind: 'exact',
        path: `${API_PREFIX}/sources`,
        handler: (req, res) => {
          if (req.method !== 'GET') { writeJson(res, 405, { ok: false, error: 'method-not-allowed' }); return }
          if (!guard(req, res)) return
          const home = homedir()
          const sources = []
          const seen = new Set()
          const addSource = (path, label, category) => {
            if (seen.has(path)) return
            seen.add(path)
            const exists = existsSync(path)
            sources.push({ path, label, category, file: basename(path), exists, lines: exists ? readFileSync(path, 'utf8').split('\n').length : 0 })
          }

          // 1. Tool config directories — scan BOTH $HOME and /root (operators run as both)
          const homeRoots = [home, '/root'].filter((root, index, arr) => arr.indexOf(root) === index)
          for (const root of homeRoots) {
            const rootLabel = root === home ? '' : ' (root)'
            for (const { dir, label } of KNOWN_SOURCES) {
              for (const file of ['AGENTS.md', 'CLAUDE.md']) {
                addSource(join(root, dir, file), `${label}${rootLabel} (${file})`, 'tool-config')
              }
            }
            // 2. Home root AGENTS.md
            for (const file of ['AGENTS.md', 'CLAUDE.md']) {
              addSource(join(root, file), `Home root${rootLabel} (${file})`, 'home')
            }
          }

          // Global tab sources: tool-config and home only (workspace files
          // belong to the workspace tab); the Linux-only repo scan this block
          // replaced never survived the filter below anyway.
          const globalOnly = sources.filter((s) => s.category === 'tool-config' || s.category === 'home')
          globalOnly.sort((a, b) => (b.exists ? 1 : 0) - (a.exists ? 1 : 0) || a.label.localeCompare(b.label))
          sources.length = 0
          sources.push(...globalOnly)

          // Check which is the current default (symlink target)
          let currentDefault = null
          try {
            const stats = lstatSync(GLOBAL_FILE)
            if (stats.isSymbolicLink()) currentDefault = readlinkSync(GLOBAL_FILE)
          } catch { /* not a symlink or doesn't exist */ }
          writeJson(res, 200, { ok: true, sources, currentDefault, globalPath: GLOBAL_FILE })
        },
      },
      {
        kind: 'exact',
        path: `${API_PREFIX}/default`,
        handler: async (req, res) => {
          if (req.method !== 'POST') { writeJson(res, 405, { ok: false, error: 'method-not-allowed' }); return }
          if (!guard(req, res)) return
          if (!(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) { writeJson(res, 415, { ok: false, error: 'json-required' }); return }
          let body
          try { body = await readJsonBody(req, 10_000) } catch (error) {
            writeJson(res, 400, { ok: false, error: error?.message ?? 'bad-request' })
            return
          }
          if (typeof body !== 'object' || body === null || typeof body.target !== 'string') {
            writeJson(res, 400, { ok: false, error: 'target-required' })
            return
          }
          const target = body.target
          if (!target.startsWith('/') || target.includes('..')) { writeJson(res, 400, { ok: false, error: 'invalid-target' }); return }
          try {
            // If reset=true, remove symlink and create a plain file
            if (body.reset === true) {
              let isLink = false
              try { isLink = lstatSync(GLOBAL_FILE).isSymbolicLink() } catch { /* absent: nothing to unlink */ }
              if (isLink) unlinkSync(GLOBAL_FILE)
              if (!existsSync(GLOBAL_FILE)) writeFileSync(GLOBAL_FILE, '', 'utf8')
              writeJson(res, 200, { ok: true, default: null, message: 'Reset to plain file' })
              return
            }
            // Create/replace the symlink: ~/.dsh/AGENTS.md -> target
            try {
              if (existsSync(GLOBAL_FILE) || lstatSync(GLOBAL_FILE).isSymbolicLink()) unlinkSync(GLOBAL_FILE)
            } catch { /* absent: nothing to unlink */ }
            symlinkSync(target, GLOBAL_FILE)
            writeJson(res, 200, { ok: true, default: target, message: `Symlinked ${GLOBAL_FILE} -> ${target}` })
          } catch (error) {
            writeJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
          }
        },
      },
      {
        kind: 'exact',
        path: `${API_PREFIX}/template`,
        handler: async (req, res) => {
          if (req.method !== 'PUT' && req.method !== 'DELETE') { writeJson(res, 405, { ok: false, error: 'method-not-allowed' }); return }
          if (!guard(req, res)) return
          if (!(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) { writeJson(res, 415, { ok: false, error: 'json-required' }); return }
          let body
          try { body = await readJsonBody(req, ACTION_LIMIT) } catch (error) {
            writeJson(res, error?.message === 'body-too-large' ? 413 : 400, { ok: false, error: error?.message ?? 'bad-request' })
            return
          }
          if (typeof body !== 'object' || body === null || typeof body.id !== 'string' || body.id.startsWith('builtin:')) {
            writeJson(res, 400, { ok: false, error: body?.id?.startsWith?.('builtin:') ? 'builtin-template-immutable' : 'invalid-body' })
            return
          }
          const name = body.id.replace(/^user:/, '').replaceAll(' ', '-')
          if (name === '' || name.includes('/') || name.includes('..')) { writeJson(res, 400, { ok: false, error: 'invalid-template-id' }); return }
          const path = join(TEMPLATE_DIR, `${name}.md`)
          try {
            if (req.method === 'DELETE') {
              if (existsSync(path)) unlinkSync(path)
              writeJson(res, 200, { ok: true })
            } else {
              if (typeof body.section !== 'string' || body.section.trim() === '') { writeJson(res, 400, { ok: false, error: 'section-required' }); return }
              mkdirSync(TEMPLATE_DIR, { recursive: true })
              writeFileSync(path, body.section, 'utf8')
              writeJson(res, 200, { ok: true, id: `user:${name}` })
            }
          } catch (error) {
            writeJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
          }
        },
      },
    ]
    const disposers = routes.map((route) => ctx.webServer.register(route))
    return () => {
      for (const dispose of disposers.reverse()) dispose()
    }
  }, 'rich-context: file + template routes')
}

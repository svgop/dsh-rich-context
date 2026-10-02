/** Bundle seam contract: the sidebar entry rides the sanctioned
 * sidebar.footer.action slot and no DOM-graft code remains (the blend
 * doctrine; same guard as dsh-rich-tracking). */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

/** Collect the primitives package's export names from the sibling harness checkout. */
function primitivesExports() {
  const root = join('..', '..', 'deepseek-harness', 'packages', 'client', 'ui-primitives', 'src')
  const index = join(root, 'index.ts')
  if (existsSync(index) === false) return null
  const names = new Set()
  for (const match of readFileSync(index, 'utf8').matchAll(/export \{([^}]+)\}/g)) {
    for (const piece of match[1].split(',')) {
      const name = piece.trim().split(' ')[0]
      if (name !== '' && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) === true) names.add(name)
    }
  }
  const iconsPath = join(root, 'icons', 'index.tsx')
  if (existsSync(iconsPath) === true) {
    for (const match of readFileSync(iconsPath, 'utf8').matchAll(/export const ([A-Za-z0-9_$]+)/g)) names.add(match[1])
  }
  return names.size > 0 ? names : null
}

test('every primitives reference in the client bundle is a real export', async () => {
  let exports = primitivesExports()
  if (exports === null) {
    const installed = join(homedir(), '.dsh', 'profiles', 'web', 'node_modules', '@deepseek-ai', 'dsh-client-ui-primitives')
    if (existsSync(installed) === false) {
      console.warn('[bundle-contract] no harness checkout and no installed primitives — skipping')
      return
    }
    const mod = await import(`file:///${installed.replaceAll('\\', '/')}/package.json`, { with: { type: 'json' } })
    const entry = mod.default.exports?.['.'] ?? mod.default.main
    const real = await import(`file:///${join(installed, entry).replaceAll('\\', '/')}`)
    exports = new Set(Object.keys(real))
  }
  const bundle = readFileSync(new URL('../src/client.bundle.js', import.meta.url), 'utf8')
  const referenced = [...new Set([...bundle.matchAll(/_deepseek_ai_dsh_client_ui_primitives\.([A-Za-z0-9_$]+)/g)].map((m) => m[1]))]
  if (referenced.length === 0) return // this bundle draws no primitives today
  const missing = referenced.filter((name) => exports.has(name) === false)
  assert.deepEqual(missing, [], `client.bundle.js references primitives the package does not export: ${missing.join(', ')}`)
})

test('the manifest rides the 0.2.0 plugin contract (no stale injects, locale meta exported)', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.equal(pkg.dsh?.client?.platform, 'web', 'dsh.client.platform stays web')
  assert.ok(
    (pkg.dsh?.client?.inject ?? []).includes('@deepseek-ai/dsh-client-runtime') === false,
    '@deepseek-ai/dsh-client-runtime was removed upstream (be531688f3) — drop the stale inject edge',
  )
  assert.ok(pkg.exports?.['./locale/*.json'], 'exports must expose ./locale/*.json so the Plugins menu can read display metadata')
  assert.ok((pkg.files ?? []).includes('locale'), 'files must ship the locale directory')
  const en = JSON.parse(readFileSync(new URL('../locale/en.json', import.meta.url), 'utf8'))
  assert.equal(typeof en.meta?.title, 'string', 'locale/en.json carries meta.title for the Plugins menu card')
})


test('the sidebar entry rides the sanctioned panellist + main slots (0.1.6 contract)', () => {
  const bundle = readFileSync(new URL('../src/client.bundle.js', import.meta.url), 'utf8')
  assert.match(bundle, /slots\.inject\("sidebar\.panellist"/, 'the panellist row is registered through the sanctioned slot')
  assert.match(bundle, /slots\.inject\("main"/, 'the panel is registered through the main slot')
  const code = bundle.split('\n').filter((line) => /^[ \t]*(\/\/|\*|\/\*)/.test(line) === false).join('\n')
  assert.doesNotMatch(code, /MutationObserver/, 'no DOM-graft observers — the shell owns the sidebar row')
  assert.doesNotMatch(code, /slots\.inject\("sidebar\.footer\.action"/, 'no footer-action registration — one entry, panellist row')
})

test('the @ trigger inserts a real newline, never a literal backslash-n', () => {
  const bundle = readFileSync(new URL('../src/client.bundle.js', import.meta.url), 'utf8')
  // The v0.7 bug: prompt.body + "\\n" appended the two characters \ and n.
  assert.doesNotMatch(bundle, /"\\\\n"/, 'no double-escaped newline string literals')
  assert.match(bundle, /String\.fromCharCode\(10\)/, 'newline appended via fromCharCode (escape-layer proof)')
})

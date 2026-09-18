/** Bundle seam contract: the sidebar entry rides the sanctioned
 * sidebar.footer.action slot and no DOM-graft code remains (the blend
 * doctrine; same guard as dsh-rich-tracking). */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

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

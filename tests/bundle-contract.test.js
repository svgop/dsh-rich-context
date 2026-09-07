/** Bundle seam contract: the sidebar entry rides the sanctioned
 * sidebar.footer.action slot and no DOM-graft code remains (the blend
 * doctrine; same guard as dsh-rich-tracking). */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('the entry registers through sidebar.footer.action; no MutationObserver graft', () => {
  const bundle = readFileSync(new URL('../src/client.bundle.js', import.meta.url), 'utf8')
  assert.match(bundle, /ctx\.slots\.inject\("sidebar\.footer\.action"/, 'the Context entry must register through the footer-action slot')
  // Comments may mention the retired graft; code must not.
  const code = bundle.split('\n').filter((line) => /^[ \t]*(\/\/|\*|\/\*)/.test(line) === false).join('\n')
  assert.doesNotMatch(code, /new MutationObserver/, 'no MutationObserver grafts in code')
  assert.doesNotMatch(code, /logoRow/, 'no logoRow hunting in code')
})

test('the @ trigger inserts a real newline, never a literal backslash-n', () => {
  const bundle = readFileSync(new URL('../src/client.bundle.js', import.meta.url), 'utf8')
  // The v0.7 bug: prompt.body + "\\n" appended the two characters \ and n.
  assert.doesNotMatch(bundle, /"\\\\n"/, 'no double-escaped newline string literals')
  assert.match(bundle, /String\.fromCharCode\(10\)/, 'newline appended via fromCharCode (escape-layer proof)')
})

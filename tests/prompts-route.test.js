/** Prompt-store route coverage: CRUD round trip as NATIVE SKILLS, legacy
 * migration, description derivation, fencing. The store is $DSH_HOME/skills —
 * the harness's own user-skill root — so every assertion doubles as a check
 * that the files we write are valid native skills. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const HOME = await mkdtemp(join(tmpdir(), 'rcx-prompts-'))
process.env.DSH_HOME = HOME
const { apply } = await import('../src/host.js')

const routes = []
apply({ effect(fn) { fn(); return () => {} }, webServer: { register(r) { routes.push(r); return () => {} } } })
const route = routes.find((r) => r.path.endsWith('/prompts'))
assert.notEqual(route, undefined, 'prompts route registered')

async function call(method, body, peer = '127.0.0.1', site = 'same-origin') {
  const res = { headers: {}, writeHead(status) { this.status = status }, end(chunk) { this.body = JSON.parse(String(chunk)) } }
  const req = { method, headers: { 'sec-fetch-site': site }, socket: { remoteAddress: peer }, url: '/api/rich-context/prompts' }
  if (body !== undefined) {
    req.headers['content-type'] = 'application/json'
    req[Symbol.asyncIterator] = async function* () { yield Buffer.from(JSON.stringify(body)) }
  }
  await route.handler(req, res)
  return res.body
}

const NL = String.fromCharCode(10)

test('save lists and deletes a prompt through the native skills store', async () => {
  let out = await call('POST', { op: 'save', slug: 'code-review-pass', description: 'Review a diff before claiming done', body: 'Review the diff for correctness.' })
  assert.equal(out.ok, true)
  assert.equal(out.prompts.length, 1)
  assert.equal(out.prompts[0].name, 'code review pass')
  assert.equal(out.prompts[0].description, 'Review a diff before claiming done')
  assert.ok(out.prompts[0].size > 0)

  // The file on disk is a VALID native skill: name+description frontmatter.
  const raw = readFileSync(join(HOME, 'skills', 'code-review-pass.md'), 'utf8')
  const head = raw.slice(0, raw.indexOf(NL + '---'))
  assert.match(head, /^---/)
  assert.match(head, /name: code-review-pass/)
  assert.match(head, /description: Review a diff before claiming done/)
  assert.ok(raw.endsWith('Review the diff for correctness.' + NL))

  // The served body is frontmatter-stripped (@name inserts only the prompt).
  out = await call('GET')
  assert.equal(out.prompts[0].body, 'Review the diff for correctness.')
  assert.doesNotMatch(out.prompts[0].body, /---|name:/)

  out = await call('POST', { op: 'delete', slug: 'code-review-pass' })
  assert.equal(out.ok, true)
  assert.equal(out.prompts.length, 0)
})

test('a save without a description derives one from the first body line (never an invalid skill)', async () => {
  const body = '# Ship gate checklist' + NL + NL + '- suites green' + NL + '- docs updated'
  let out = await call('POST', { op: 'save', slug: 'ship-checklist', body })
  assert.equal(out.ok, true)
  assert.equal(out.prompts.find((p) => p.slug === 'ship-checklist').description, 'Ship gate checklist')
  const raw = readFileSync(join(HOME, 'skills', 'ship-checklist.md'), 'utf8')
  assert.match(raw, /description: Ship gate checklist/)
  await call('POST', { op: 'delete', slug: 'ship-checklist' })
})

test('legacy rich-context/prompts migrate into the skills root on first touch', async () => {
  mkdirSync(join(HOME, 'rich-context', 'prompts'), { recursive: true })
  writeFileSync(join(HOME, 'rich-context', 'prompts', 'legacy-thing.md'), 'Do the legacy thing carefully.' + NL + 'More lines.', 'utf8')
  const out = await call('GET')
  const migrated = out.prompts.find((prompt) => prompt.slug === 'legacy-thing')
  assert.notEqual(migrated, undefined, 'legacy prompt listed after migration')
  assert.equal(migrated.body, 'Do the legacy thing carefully.' + NL + 'More lines.')
  assert.equal(migrated.description, 'Do the legacy thing carefully.')
  assert.equal(existsSync(join(HOME, 'skills', 'legacy-thing.md')), true, 'native skill file written')
  assert.equal(existsSync(join(HOME, 'rich-context', 'prompts', 'legacy-thing.md')), false, 'legacy file removed')
  await call('POST', { op: 'delete', slug: 'legacy-thing' })
})

test('directory-shaped skills (<dir>/SKILL.md) list alongside flat files', async () => {
  mkdirSync(join(HOME, 'skills', 'dir-skill'), { recursive: true })
  const skill = '---' + NL + 'name: dir-skill' + NL + 'description: a directory skill' + NL + '---' + NL + NL + 'Body of the dir skill.' + NL
  writeFileSync(join(HOME, 'skills', 'dir-skill', 'SKILL.md'), skill, 'utf8')
  const out = await call('GET')
  const found = out.prompts.find((prompt) => prompt.slug === 'dir-skill')
  assert.notEqual(found, undefined)
  assert.equal(found.body, 'Body of the dir skill.')
  assert.equal(found.description, 'a directory skill')
  await call('POST', { op: 'delete', slug: 'dir-skill' })
  assert.equal(existsSync(join(HOME, 'skills', 'dir-skill', 'SKILL.md')), false, 'delete removes the SKILL.md')
})

test('refuses invalid slugs, empty bodies, and unknown ops', async () => {
  assert.equal((await call('POST', { op: 'save', slug: 'BAD SLUG', body: 'x' })).ok, false)
  assert.equal((await call('POST', { op: 'save', slug: 'fine-slug', body: '  ' })).ok, false)
  assert.equal((await call('POST', { op: 'nope', slug: 'fine-slug' })).ok, false)
})

test('the loopback + same-origin fence rejects foreign peers', async () => {
  assert.equal((await call('GET', undefined, '192.168.1.9')).error, 'forbidden')
  assert.equal((await call('GET', undefined, '127.0.0.1', 'cross-site')).error, 'forbidden')
})

await rm(HOME, { recursive: true, force: true })

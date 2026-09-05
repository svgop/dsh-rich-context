/** Prompt-store route coverage: CRUD round trip, validation refusals, fencing. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
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

test('save lists and deletes a prompt through the markdown store', async () => {
  let out = await call('POST', { op: 'save', slug: 'code-review-pass', body: 'Review the diff for correctness.' })
  assert.equal(out.ok, true)
  assert.equal(out.prompts.length, 1)
  assert.equal(out.prompts[0].name, 'code review pass')
  assert.ok(out.prompts[0].size > 0)

  out = await call('GET')
  assert.equal(out.prompts[0].body, 'Review the diff for correctness.')

  out = await call('POST', { op: 'delete', slug: 'code-review-pass' })
  assert.equal(out.ok, true)
  assert.equal(out.prompts.length, 0)
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

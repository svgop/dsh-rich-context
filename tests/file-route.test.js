/** /file route coverage with a Windows-flavored workspace: the v0.7 route
 * required a posix leading slash, so EVERY drive-letter workspace path
 * (~E:\...) was refused with invalid-workspace — the Workspace tab could
 * list workspaces but never read or save their AGENTS.md on Windows. */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const HOME = await mkdtemp(join(tmpdir(), 'rcx-file-'))
process.env.DSH_HOME = HOME
const { apply } = await import('../src/host.js')

const routes = []
apply({ effect(fn) { fn(); return () => {} }, webServer: { register(r) { routes.push(r); return () => {} } } })
const route = routes.find((r) => r.path.endsWith('/file'))
assert.notEqual(route, undefined, 'file route registered')

async function call(method, body, query = '') {
  const res = { headers: {}, writeHead(status) { this.status = status }, end(chunk) { this.body = chunk === undefined ? null : JSON.parse(String(chunk)) } }
  const req = { method, url: `/api/rich-context/file${query}`, headers: { 'sec-fetch-site': 'same-origin' }, socket: { remoteAddress: '127.0.0.1' } }
  if (body !== undefined) {
    req.headers['content-type'] = 'application/json'
    req[Symbol.asyncIterator] = async function* () { yield Buffer.from(JSON.stringify(body)) }
  }
  await route.handler(req, res)
  return res.body
}

test('a Windows drive-letter workspace reads and saves AGENTS.md', async () => {
  // A real temp dir addressed with backslashes, as the workspace discovery
  // reports it on Windows.
  const ws = join(HOME, 'repo').replaceAll('/', '\\')
  const read = await call('GET', undefined, `?scope=workspace&workspace=${encodeURIComponent(ws)}`)
  assert.equal(read.ok, true, `read must accept a drive-style path, got ${JSON.stringify(read)}`)
  assert.equal(read.content, null, 'no file yet reads as null, not an error')

  const saved = await call('PUT', { scope: 'workspace', workspace: ws, content: '# rules' + String.fromCharCode(10) })
  assert.equal(saved.ok, true, `save must accept a drive-style path, got ${JSON.stringify(saved)}`)
  const onDisk = await readFile(join(HOME, 'repo', 'AGENTS.md'), 'utf8')
  assert.equal(onDisk, '# rules' + String.fromCharCode(10))
})

test('posix workspaces still work; traversal and relative junk still refused', async () => {
  const read = await call('GET', undefined, `?scope=workspace&workspace=${encodeURIComponent('/tmp')}`)
  assert.equal(read.ok, true)
  assert.equal((await call('GET', undefined, '?scope=workspace&workspace=relative/path')).error, 'invalid-workspace')
  assert.equal((await call('GET', undefined, `?scope=workspace&workspace=${encodeURIComponent('/tmp/../etc')}`)).error, 'invalid-workspace')
  assert.equal((await call('PUT', { scope: 'custom', path: 'relative\\nope', content: 'x' })).error, 'invalid-path')
  assert.equal((await call('PUT', { scope: 'custom', path: 'E:\\..\\escape', content: 'x' })).error, 'invalid-path')
})

await rm(HOME, { recursive: true, force: true })

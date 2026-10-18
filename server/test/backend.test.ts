import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createPokemonCache } from '../src/cache/pokemon.cache.js';
import { createApp } from '../src/app.js';

const entries = [
  { id: 25, name: 'pikachu' }, { id: 4, name: 'charmander' },
  { id: 6, name: 'charizard' }, { id: 1, name: 'bulbasaur' },
];
const page = (items = entries) => ({
  count: items.length, next: null,
  results: items.map(({ id, name }) => ({ name, url: `https://pokeapi.co/api/v2/pokemon/${id}/` })),
});
const json = (value: unknown, status = 200) => Response.json(value, { status });
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

function fixture() {
  let time = 0;
  let calls = 0;
  let handler: typeof fetch = async () => json(page());
  const errors: unknown[] = [];
  const cache = createPokemonCache({
    fetcher: (...args) => { calls++; return handler(...args); },
    now: () => time,
    logRefreshError: (error) => { errors.push(error); },
  });
  return {
    cache, errors,
    calls: () => calls,
    expire: () => { time += 3_600_000; },
    setHandler: (next: typeof fetch) => { handler = next; },
  };
}

test('cold load is complete, concurrent loads deduplicate, fresh catalog avoids fetches', async () => {
  const f = fixture();
  const gate = deferred<Response>();
  const urls: string[] = [];
  f.setHandler(async (url) => { urls.push(String(url)); return urls.length === 1 ? gate.promise : json(page()); });
  const a = f.cache.getIndex();
  const b = f.cache.getIndex();
  assert.equal(f.calls(), 1);
  gate.resolve(json(page()));
  assert.equal(await a, await b);
  assert.equal((await f.cache.getIndex()).length, 4);
  assert.equal(f.calls(), 2);
  assert.deepEqual(urls, ['https://pokeapi.co/api/v2/pokemon/?limit=1', 'https://pokeapi.co/api/v2/pokemon/?limit=4']);
});

test('expired catalog returns immediately, deduplicates refresh, then replaces snapshot', async () => {
  const f = fixture();
  const old = await f.cache.getIndex();
  f.expire();
  const gate = deferred<Response>();
  f.setHandler(async () => (await gate.promise).clone());
  assert.equal(await f.cache.getIndex(), old);
  assert.equal(await f.cache.getIndex(), old);
  assert.equal(f.calls(), 3);
  gate.resolve(json(page([entries[0]!])));
  await tick();
  assert.deepEqual((await f.cache.getIndex()).map(({ id }) => id), [25]);
  const calls = f.calls();
  await f.cache.getIndex();
  assert.equal(f.calls(), calls);
});

test('failed stale refresh preserves catalog, logs failure, and allows retry', async () => {
  const f = fixture();
  const old = await f.cache.getIndex();
  f.expire();
  f.setHandler(async () => { throw new Error('offline'); });
  assert.equal(await f.cache.getIndex(), old);
  await tick();
  assert.equal(f.errors.length, 1);
  f.setHandler(async () => json(page([entries[0]!])));
  assert.equal(await f.cache.getIndex(), old);
  await tick();
  assert.equal((await f.cache.getIndex()).length, 1);
});

for (const [label, data] of [
  ['empty', { count: 4, next: null, results: [] }],
  ['incomplete', { ...page(), count: 5 }],
  ['paginated', { ...page(), next: 'https://pokeapi.co/next' }],
  ['invalid resource URL', { ...page(), results: [{ name: 'pikachu', url: 'https://evil.test/25/' }] }],
  ['duplicate', page([entries[0]!, entries[0]!])],
] as const) {
  test(`${label} upstream catalog never replaces valid stale data`, async () => {
    const f = fixture();
    const old = await f.cache.getIndex();
    f.expire();
    f.setHandler(async () => json(data));
    assert.equal(await f.cache.getIndex(), old);
    await tick();
    assert.equal(f.errors.length, 1);
    assert.equal(await f.cache.getIndex(), old);
    await tick();
  });
}

test('cold failure propagates and can be retried', async () => {
  const f = fixture();
  f.setHandler(async () => json({}, 503));
  await assert.rejects(f.cache.getIndex(), { status: 503 });
  f.setHandler(async () => json(page()));
  assert.equal((await f.cache.getIndex()).length, 4);
});

test('details requests deduplicate and failures are not cached', async () => {
  const f = fixture();
  f.setHandler(async () => json({}, 404));
  await assert.rejects(f.cache.getDetails(25), { status: 404 });
  const gate = deferred<Response>();
  f.setHandler(async () => gate.promise);
  const a = f.cache.getDetails(25);
  const b = f.cache.getDetails(25);
  assert.equal(f.calls(), 2);
  gate.resolve(json({ id: 25, name: 'pikachu', height: 4, weight: 60,
    types: [{ slot: 1, type: { name: 'electric' } }] }));
  assert.equal(await a, await b);
  assert.equal((await f.cache.getDetails(25)).weight, 6);
  assert.equal(f.calls(), 2);
});

test('timeout aborts the upstream request and returns a controlled failure', async () => {
  const cache = createPokemonCache({ timeoutMs: 1, fetcher: async (_url, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
    }),
  });
  // AbortSignal's timer is unref'ed; keep the test alive until it fires.
  const keepAlive = setInterval(() => {}, 1000);
  try { await assert.rejects(cache.getIndex(), { status: 504 }); }
  finally { clearInterval(keepAlive); }
});

async function withApi(
  run: (get: (path: string) => Promise<{ status: number; body: unknown }>, f: ReturnType<typeof fixture>) => Promise<void>,
) {
  const f = fixture();
  const app = createApp(f.cache);
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    await run(async (path) => {
      const res = await fetch(`http://127.0.0.1:${address.port}${path}`);
      return { status: res.status, body: await res.json() as unknown };
    }, f);
  } finally {
    if (server.listening) {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  }
}

const summary = (id: number, name: string) => ({ id, name,
  image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png` });

test('health and default list expose explicit response contracts', async () => withApi(async (get) => {
  assert.deepEqual(await get('/api/health'), { status: 200, body: { status: 'ok' } });
  assert.deepEqual(await get('/api/pokemon'), { status: 200, body: {
    results: [summary(1, 'bulbasaur'), summary(4, 'charmander'), summary(6, 'charizard'), summary(25, 'pikachu')],
    total: 4, limit: 20, offset: 0,
  } });
}));

test('full-catalog search trims and ignores case; empty and out-of-range pages succeed', async () => withApi(async (get) => {
  assert.deepEqual(await get('/api/pokemon?search=%20CHAR%20&limit=1&offset=1'), { status: 200, body: {
    results: [summary(6, 'charizard')], total: 2, limit: 1, offset: 1,
  } });
  assert.deepEqual(await get('/api/pokemon?search=missing'), { status: 200, body: { results: [], total: 0, limit: 20, offset: 0 } });
  assert.deepEqual(await get('/api/pokemon?offset=100'), { status: 200, body: { results: [], total: 4, limit: 20, offset: 100 } });
}));

for (const [sortBy, order, ids] of [
  ['id', 'asc', [1, 4, 6, 25]], ['id', 'desc', [25, 6, 4, 1]],
  ['name', 'asc', [1, 6, 4, 25]], ['name', 'desc', [25, 4, 6, 1]],
] as const) {
  test(`sort ${sortBy} ${order} does not mutate cache`, async () => withApi(async (get, f) => {
    const snapshot = [...await f.cache.getIndex()];
    const response = await get(`/api/pokemon?sortBy=${sortBy}&order=${order}`);
    assert.equal(response.status, 200);
    assert.deepEqual((response.body as { results: { id: number }[] }).results.map(({ id }) => id), ids);
    assert.deepEqual(await f.cache.getIndex(), snapshot);
  }));
}

test('invalid query and route inputs consistently return 400 without upstream calls', async () => withApi(async (get, f) => {
  for (const query of ['limit=abc', 'limit=0', 'limit=101', 'limit=1.5', 'limit=', 'offset=-1', 'offset=1.1',
    'offset=9007199254740992', 'sortBy=weight', 'order=up', 'search=a&search=b', 'limit=2&limit=3', 'search[x]=a', 'unknown=yes']) {
    const response = await get(`/api/pokemon?${query}`);
    assert.equal(response.status, 400, query);
    assert.equal((response.body as { error: { code: string } }).error.code, 'INVALID_REQUEST');
  }
  for (const value of ['0', '-1', '1.5', 'a_b', '9007199254740992', '%20']) {
    assert.equal((await get(`/api/pokemon/${value}`)).status, 400, value);
  }
  assert.equal(f.calls(), 0);
}));

test('details by normalized name and ID share cache and convert units', async () => withApi(async (get, f) => {
  f.setHandler(async (url) => String(url).includes('?') ? json(page()) : json({
    id: 25, name: 'pikachu', height: 4, weight: 60,
    types: [{ slot: 1, type: { name: 'electric' } }],
  }));
  const expected = { status: 200, body: { ...summary(25, 'pikachu'), types: ['electric'], height: 0.4, weight: 6 } };
  assert.deepEqual(await get('/api/pokemon/%20PIKACHU%20'), expected);
  assert.deepEqual(await get('/api/pokemon/025'), expected);
  assert.equal(f.calls(), 3);
}));

test('missing names, upstream 404s, and unknown routes use centralized 404 errors', async () => withApi(async (get, f) => {
  assert.equal((await get('/api/pokemon/missing')).status, 404);
  f.setHandler(async () => json({}, 404));
  assert.deepEqual(await get('/api/pokemon/9999'), { status: 404,
    body: { error: { code: 'POKEMON_NOT_FOUND', message: 'Pokémon not found' } } });
  assert.deepEqual(await get('/unknown'), { status: 404,
    body: { error: { code: 'NOT_FOUND', message: 'Endpoint not found' } } });
}));

for (const [label, handler, status, code] of [
  ['network', async () => { throw new Error('private network details'); }, 502, 'UPSTREAM_ERROR'],
  ['upstream 500', async () => json({}, 500), 502, 'UPSTREAM_ERROR'],
  ['unavailable', async () => json({}, 503), 503, 'UPSTREAM_UNAVAILABLE'],
  ['rate limited', async () => json({}, 429), 503, 'UPSTREAM_UNAVAILABLE'],
  ['malformed JSON', async () => new Response('{'), 502, 'UPSTREAM_ERROR'],
  ['invalid details', async () => json({ id: 25 }), 502, 'INVALID_UPSTREAM_DATA'],
] as const) {
  test(`${label} maps to a controlled API error`, async (t) => {
    t.mock.method(console, 'error', () => {});
    await withApi(async (get, f) => {
      f.setHandler(handler);
      const response = await get('/api/pokemon/25');
      assert.equal(response.status, status);
      const body = response.body as { error: { code: string; message: string } };
      assert.deepEqual(Object.keys(body), ['error']);
      assert.deepEqual(Object.keys(body.error).sort(), ['code', 'message']);
      assert.equal(body.error.code, code);
      assert.ok(!JSON.stringify(body).includes('private network details'));
    });
  });
}

test('unexpected internal failures return a generic 500 without diagnostic details', async (t) => {
  t.mock.method(console, 'error', () => {});
  await withApi(async (get, f) => {
    t.mock.method(f.cache, 'getIndex', async () => { throw new Error('sensitive internals'); });
    assert.deepEqual(await get('/api/pokemon'), { status: 500,
      body: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } } });
  });
});

test('upstream timeout returns HTTP 504 with the consistent error shape', async (t) => {
  t.mock.method(console, 'error', () => {});
  const cache = createPokemonCache({ timeoutMs: 1, fetcher: async (_url, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
    }),
  });
  await withApi(async (get, f) => {
    t.mock.method(f.cache, 'getDetails', (id: number) => cache.getDetails(id));
    assert.deepEqual(await get('/api/pokemon/25'), { status: 504,
      body: { error: { code: 'UPSTREAM_TIMEOUT', message: 'Pokémon data request timed out' } } });
  });
});

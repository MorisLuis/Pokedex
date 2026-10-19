import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readCatalogQuery } from '../src/hooks/useCatalogQuery.ts';
import { parseFavorites } from '../src/hooks/useFavorites.ts';
import { getPokemonDetails, getPokemonList } from '../src/services/pokemon.service.ts';

const defaults = { search: '', sortBy: 'id', order: 'asc', limit: 20, offset: 0 } as const;
test('URL query defaults and invalid values normalize to valid backend parameters', () => {
  assert.deepEqual(readCatalogQuery(''), defaults);
  assert.deepEqual(readCatalogQuery('?sortBy=bad&order=up&limit=0&offset=-1'), defaults);
  assert.deepEqual(readCatalogQuery('?limit=1.5&offset=9007199254740992'), defaults);
});
test('URL query preserves valid search, ordering, and pagination across reloads', () => {
  assert.deepEqual(readCatalogQuery('?search=%20PIKA%20&sortBy=name&order=desc&limit=12&offset=24'),
    { search: 'PIKA', sortBy: 'name', order: 'desc', limit: 12, offset: 24 });
});
test('favorites ignore corrupt storage, duplicates, and invalid IDs', () => {
  for (const value of [null, 'bad json', '{}', 'null']) assert.deepEqual(parseFavorites(value), []);
  assert.deepEqual(parseFavorites('[25,25,1,-1,0,1.5,"4",null]'), [25, 1]);
});
test('list service encodes backend query and forwards the AbortSignal', async (t) => {
  const controller = new AbortController();
  const body = { results: [], total: 0, limit: 20, offset: 0 };
  t.mock.method(globalThis, 'fetch', async (input: string, init: RequestInit) => {
    assert.ok(input.startsWith('/api/pokemon?'));
    assert.equal(new URLSearchParams(input.split('?')[1]).get('search'), 'mr mime&');
    assert.equal(init.signal, controller.signal);
    return Response.json(body);
  });
  assert.deepEqual(await getPokemonList({ ...defaults, search: 'mr mime&' }, controller.signal), body);
});
test('details service uses our backend and returns the domain contract', async (t) => {
  const body = { id: 25, name: 'pikachu', image: 'image.png', types: ['electric'], height: 0.4, weight: 6 };
  t.mock.method(globalThis, 'fetch', async (input: string) => {
    assert.equal(input, '/api/pokemon/pika%2Fchu');
    return Response.json(body);
  });
  assert.deepEqual(await getPokemonDetails({ nameOrId: 'pika/chu' }), body);
});
test('non-2xx responses expose the centralized backend error message', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Temporarily unavailable' } }, { status: 503 }));
  await assert.rejects(getPokemonList(defaults), { message: 'Temporarily unavailable' });
  await assert.rejects(getPokemonDetails({ nameOrId: 25 }), { message: 'Temporarily unavailable' });
});
test('non-JSON errors have a readable fallback and request cancellation propagates', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => new Response('<html>Bad gateway</html>', { status: 502 }));
  await assert.rejects(getPokemonDetails({ nameOrId: 25 }), /Request failed \(502\)/);
  mock.mock.mockImplementation(async () => { throw new DOMException('Cancelled', 'AbortError'); });
  await assert.rejects(getPokemonList(defaults), { name: 'AbortError' });
});

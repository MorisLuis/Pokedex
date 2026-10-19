import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

test('occupied-port startup reports the error and exits unsuccessfully without logging readiness', async () => {
  // Match index.ts's default bind address so IPv4/IPv6 differences cannot hide a collision.
  const occupied = createServer().listen(0);
  try {
    await once(occupied, 'listening');
    const address = occupied.address();
    assert.ok(address && typeof address !== 'string');

    const result = spawnSync(process.execPath, [
      '--import', 'tsx', fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    ], {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      env: { ...process.env, PORT: String(address.port) },
      encoding: 'utf8',
      timeout: 5000,
    });

    assert.equal(result.error, undefined);
    assert.equal(result.signal, null);
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(`port ${address.port} is already in use`));
    assert.match(result.stderr, /EADDRINUSE/);
    assert.doesNotMatch(result.stdout, /API listening/);
  } finally {
    await new Promise<void>((resolve, reject) => {
      occupied.close((error) => error ? reject(error) : resolve());
    });
  }
});

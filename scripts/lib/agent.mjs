// Run translation agents (claude / opencode) with bounded concurrency.
import { spawn, spawnSync } from 'node:child_process';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Transient failures worth retrying: opencode shares one SQLite session store
// across processes, so concurrent agent calls can hit "database is locked".
const RETRYABLE = /database is locked|database table is locked|SQLITE_BUSY|EAGAIN|temporarily unavailable/i;

// Spawn an agent CLI, feeding the prompt on stdin, returning stdout.
function spawnAgent({ cmd, args, input, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`agent timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`${cmd} exited with ${code}: ${err.slice(0, 600)}`));
    });
    child.stdin.end(input);
  });
}

// runAgent with bounded retry + exponential back-off (jittered) on transient
// errors. Jitter spreads retries so concurrent calls don't re-collide on the lock.
export async function runAgent({ cmd, args, input, timeoutMs, retries = 4, baseDelayMs = 500 }) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await spawnAgent({ cmd, args, input, timeoutMs });
    } catch (e) {
      if (attempt >= retries || !RETRYABLE.test(e.message)) throw e;
      await sleep(baseDelayMs * 2 ** attempt + Math.random() * baseDelayMs);
    }
  }
}

// Bounded-concurrency async map preserving order.
export async function pMap(items, fn, concurrency) {
  const results = new Array(items.length);
  let next = 0;
  const n = Math.max(1, Math.min(concurrency, items.length));
  const workers = Array.from({ length: n }, async () => {
    while (true) {
      const idx = next++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

// Is a CLI available on PATH?
export function commandExists(cmd) {
  return spawnSync('sh', ['-c', `command -v ${cmd}`], { stdio: 'ignore' }).status === 0;
}

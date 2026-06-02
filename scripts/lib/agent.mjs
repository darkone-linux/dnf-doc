// Run translation agents (claude / opencode) with bounded concurrency.
import { spawn, spawnSync } from 'node:child_process';

// Spawn an agent CLI, feeding the prompt on stdin, returning stdout.
export function runAgent({ cmd, args, input, timeoutMs }) {
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

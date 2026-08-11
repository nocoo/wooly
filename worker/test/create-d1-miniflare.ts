import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

/** Miniflare 5.20260804+ requires workers-shaped options; convert legacy V4 opts. */
export function createD1Miniflare(): Miniflare {
  return new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: 'export default { fetch() { return new Response("ok") } }',
      d1Databases: ['DB'],
    }),
  );
}

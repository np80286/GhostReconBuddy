import { cp, mkdir, rm } from 'node:fs/promises';

const source = 'dist/client';
const output = 'site';

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(`${source}/GhostReconBuddy.html`, `${output}/index.html`);
await cp(`${source}/GhostReconBuddy/_next`, `${output}/_next`, { recursive: true });
await cp(`${source}/GhostReconBuddy/favicon.svg`, `${output}/favicon.svg`);
await cp(`${source}/404.html`, `${output}/404.html`);

// GitHub Pages serves this directory at /GhostReconBuddy/.
// Vinext already emitted asset URLs with that base path.

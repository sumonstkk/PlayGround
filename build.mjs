import { mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const project = process.cwd();
const output = resolve(project, 'dist');
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'game.js', 'style.css']) {
  await copyFile(resolve(project, file), resolve(output, file));
}
console.log(`Built static game into ${output}`);

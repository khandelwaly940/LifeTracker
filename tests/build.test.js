import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  cp,
  readFile,
  appendFile,
  rm,
  access,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "../scripts/build.mjs";

test("deployments version the entire import graph and change URLs when a dependency changes", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "lifetracker-build-"));
  const source = fileURLToPath(new URL("..", import.meta.url));
  try {
    for (const name of ["index.html", "styles.css", "favicon.svg", "src"])
      await cp(path.join(source, name), path.join(root, name), {
        recursive: true,
      });
    const first = await build(root);
    const html = await readFile(path.join(first.output, "index.html"), "utf8");
    assert.ok(html.includes(`./assets/${first.release}/src/app.js`));
    assert.ok(html.includes(`./assets/${first.release}/styles.css`));
    assert.ok(!html.includes('src="./src/app.js"'));
    const queue = [`assets/${first.release}/src/app.js`],
      seen = new Set();
    while (queue.length) {
      const file = queue.shift();
      if (seen.has(file)) continue;
      seen.add(file);
      assert.ok(file.startsWith(`assets/${first.release}/`));
      const code = await readFile(path.join(first.output, file), "utf8");
      for (const match of code.matchAll(/from\s+["'](\.[^"']+)["']/g))
        queue.push(path.normalize(path.join(path.dirname(file), match[1])));
    }
    assert.equal(seen.size, 4);
    assert.equal(
      (await build(root)).release,
      first.release,
      "unchanged sources produce the same release",
    );
    await appendFile(
      path.join(root, "src/features/fitness.js"),
      "\n// New release\n",
    );
    const next = await build(root);
    assert.notEqual(
      next.release,
      first.release,
      "dependency-only edits change every asset URL",
    );
    await access(
      path.join(next.output, `assets/${next.release}/src/features/fitness.js`),
    );
    await assert.rejects(access(path.join(next.output, "src/app.js")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

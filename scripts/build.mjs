import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function listFiles(root, relative = "src") {
  const entries = await readdir(path.join(root, relative), {
    withFileTypes: true,
  });
  const files = await Promise.all(
    entries.map((entry) => {
      const name = path.join(relative, entry.name);
      return entry.isDirectory() ? listFiles(root, name) : [name];
    }),
  );
  return files.flat().sort();
}

// All modules live in one content-addressed directory. Relative imports stay
// inside that release, so cached files from earlier releases cannot mix in.
export async function build(root) {
  const files = [
    "index.html",
    "styles.css",
    "favicon.svg",
    ...(await listFiles(root)),
  ];
  const hash = createHash("sha256");
  for (const file of files)
    hash
      .update(file)
      .update("\0")
      .update(await readFile(path.join(root, file)))
      .update("\0");
  const release = hash.digest("hex").slice(0, 16);
  const output = path.join(root, "dist");
  const assetRoot = path.join(output, "assets", release);
  await rm(output, { recursive: true, force: true });
  await mkdir(assetRoot, { recursive: true });
  await cp(path.join(root, "src"), path.join(assetRoot, "src"), {
    recursive: true,
  });
  for (const asset of ["styles.css", "favicon.svg"])
    await cp(path.join(root, asset), path.join(assetRoot, asset));
  let html = await readFile(path.join(root, "index.html"), "utf8");
  for (const asset of ["styles.css", "favicon.svg", "src/app.js"]) {
    const reference = `"./${asset}"`;
    if (!html.includes(reference))
      throw new Error(`Missing HTML asset reference: ${asset}`);
    html = html.replaceAll(reference, `"./assets/${release}/${asset}"`);
  }
  await writeFile(path.join(output, "index.html"), html);
  await writeFile(path.join(output, ".nojekyll"), "");
  return { release, output };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const { release } = await build(
    path.resolve(fileURLToPath(new URL("..", import.meta.url))),
  );
  console.log(`Built dist/ with release ${release}`);
}

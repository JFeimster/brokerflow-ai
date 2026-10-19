import { readdir, mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import yazl from "yazl";

await import("./validate-plugin-assets.js");

const root = resolve(fileURLToPath(new URL("../plugin/", import.meta.url)));
const output = resolve(process.argv[2] || "dist/BrokerFlow-Private-Plugin.zip");

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

const files = await filesIn(root);
const required = ["plugin.json", "mcp.json", "README.md"];
for (const file of required) {
  if (!files.some(path => relative(root, path).split(sep).join("/") === file)) {
    throw new Error(`Plugin package is missing ${file}.`);
  }
}
await mkdir(resolve(output, ".."), { recursive: true });
const zip = new yazl.ZipFile();
for (const path of files) zip.addFile(path, relative(root, path).split(sep).join("/"));
await new Promise((resolvePromise, reject) => {
  const stream = createWriteStream(output);
  stream.on("error", reject);
  stream.on("close", resolvePromise);
  zip.outputStream.pipe(stream);
  zip.end();
});
process.stdout.write(`Created ${output} with ${files.length} plugin files.\n`);

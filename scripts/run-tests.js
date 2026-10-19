import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const postgres = process.argv.includes("--postgres");
async function discover(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const lists = await Promise.all(
    entries.map((item) =>
      item.isDirectory()
        ? discover(`${path}/${item.name}`)
        : Promise.resolve(
            item.name.endsWith(".test.js") ? [`${path}/${item.name}`] : [],
          ),
    ),
  );
  return lists.flat();
}
const files = (await discover("tests"))
  .filter((path) => (postgres ? /postgres/.test(path) : !/postgres/.test(path)))
  .sort();
const run = spawnSync(
  process.execPath,
  ["--test", ...(postgres ? ["--test-concurrency=1"] : []), ...files],
  { stdio: "inherit", env: process.env },
);
process.exit(run.status ?? 1);

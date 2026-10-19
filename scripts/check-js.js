import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
async function check(path) {
  for (const item of await readdir(path, { withFileTypes: true })) {
    const file = `${path}/${item.name}`;
    if (
      item.isDirectory() &&
      ["api", "lib", "scripts"].some(
        (root) => file === `./${root}` || file.startsWith(`./${root}/`),
      )
    )
      await check(file);
    else if (item.isFile() && item.name.endsWith(".js")) {
      const run = spawnSync(process.execPath, ["--check", file], {
        stdio: "inherit",
      });
      if (run.status) process.exit(run.status);
    }
  }
}
await check(".");

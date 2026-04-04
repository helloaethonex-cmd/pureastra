import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_ROOT = path.join(ROOT, "src");
const PUBLIC_ROOT = path.join(ROOT, "public");

const TARGET_EXT_RE = /\.(png|jpe?g)$/i;
const REF_RE = /\/img\/[A-Za-z0-9/_\-.]+\.(png|jpe?g)/g;
const SOURCE_FILE_RE = /\.(ts|tsx|js|jsx|css|md)$/i;

const walkFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walkFiles(fullPath);
      return fullPath;
    }),
  );
  return files.flat();
};

const run = async () => {
  const files = await walkFiles(SRC_ROOT);
  let changedFiles = 0;
  let changedRefs = 0;

  for (const filePath of files) {
    if (!SOURCE_FILE_RE.test(filePath)) continue;

    const original = await fs.readFile(filePath, "utf8");
    let didChange = false;

    const updated = original.replace(REF_RE, (matched) => {
      const currentPublicPath = path.join(PUBLIC_ROOT, matched.replace(/^\//, ""));
      const webpPublicPath = currentPublicPath.replace(TARGET_EXT_RE, ".webp");

      if (!TARGET_EXT_RE.test(currentPublicPath)) return matched;

      if (!fsSync.existsSync(webpPublicPath)) {
        return matched;
      }

      didChange = true;
      changedRefs += 1;
      return matched.replace(TARGET_EXT_RE, ".webp");
    });

    if (didChange) {
      await fs.writeFile(filePath, updated, "utf8");
      changedFiles += 1;
      console.log(`[updated] ${path.relative(ROOT, filePath)}`);
    }
  }

  console.log(`\nFiles changed: ${changedFiles}`);
  console.log(`Image refs changed: ${changedRefs}`);
};

run().catch((error) => {
  console.error("Failed to replace image references:", error);
  process.exit(1);
});

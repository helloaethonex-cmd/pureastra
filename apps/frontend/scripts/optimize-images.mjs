import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const IMG_ROOT = path.join(ROOT, "public", "img");
const MIN_BYTES = 80 * 1024;

const isConvertible = (filePath) => /\.(png|jpe?g)$/i.test(filePath);

const toWebpPath = (filePath) => filePath.replace(/\.(png|jpe?g)$/i, ".webp");

const walkFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walkFiles(fullPath);
      }
      return fullPath;
    }),
  );
  return files.flat();
};

const formatBytes = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const run = async () => {
  const files = await walkFiles(IMG_ROOT);
  let converted = 0;
  let originalTotal = 0;
  let optimizedTotal = 0;

  for (const filePath of files) {
    if (!isConvertible(filePath)) continue;

    const stat = await fs.stat(filePath);
    if (stat.size < MIN_BYTES) continue;

    const webpPath = toWebpPath(filePath);

    await sharp(filePath)
      .rotate()
      .webp({
        quality: 90,
        alphaQuality: 95,
        effort: 6,
        smartSubsample: true,
      })
      .toFile(webpPath);

    const optimizedStat = await fs.stat(webpPath);
    converted += 1;
    originalTotal += stat.size;
    optimizedTotal += optimizedStat.size;

    console.log(
      `[optimized] ${path.relative(ROOT, filePath)} -> ${path.relative(ROOT, webpPath)} (${formatBytes(stat.size)} -> ${formatBytes(optimizedStat.size)})`,
    );
  }

  const saved = originalTotal - optimizedTotal;
  const reduction = originalTotal > 0 ? ((saved / originalTotal) * 100).toFixed(2) : "0.00";
  console.log(`\nConverted files: ${converted}`);
  console.log(`Original total: ${formatBytes(originalTotal)}`);
  console.log(`Optimized total: ${formatBytes(optimizedTotal)}`);
  console.log(`Saved: ${formatBytes(saved)} (${reduction}%)`);
};

run().catch((error) => {
  console.error("Image optimization failed:", error);
  process.exit(1);
});


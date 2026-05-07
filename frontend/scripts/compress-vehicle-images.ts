#!/usr/bin/env bun
/* eslint-disable no-console */
import sharp from "sharp";
import { existsSync, statSync } from "fs";
import { readFile, writeFile, unlink } from "fs/promises";

const images = [
  { name: "mini.png", path: "../backend/Api/wwwroot/uploads/seed/mini.png" },
  { name: "midi.png", path: "../backend/Api/wwwroot/uploads/seed/midi.png" },
  { name: "maxi.png", path: "../backend/Api/wwwroot/uploads/seed/maxi.png" },
];

async function compressImage(inputPath: string, outputPath: string) {
  if (!existsSync(inputPath)) {
    console.error(`❌ File not found: ${inputPath}`);
    return;
  }

  const originalStats = statSync(inputPath);
  const originalSize = originalStats.size;

  await sharp(inputPath)
    .resize(800, 600, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({
      quality: 90,
      compressionLevel: 9,
      palette: true, // Use palette-based PNG for smaller file size
    })
    .toFile(outputPath + ".tmp");

  // Replace original with compressed
  const compressedData = await readFile(outputPath + ".tmp");
  await writeFile(outputPath, compressedData);
  await unlink(outputPath + ".tmp");

  const compressedStats = statSync(outputPath);
  const compressedSize = compressedStats.size;
  const savedBytes = originalSize - compressedSize;
  const savedPercent = ((savedBytes / originalSize) * 100).toFixed(2);

  console.log(`✅ ${inputPath}`);
  console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB`);
  console.log(`   Compressed: ${(compressedSize / 1024).toFixed(2)} KB`);
  console.log(`   Saved: ${(savedBytes / 1024).toFixed(2)} KB (${savedPercent}%)\n`);
}

async function main() {
  console.log("🖼️  Compressing vehicle class images in backend/Api/wwwroot/uploads/seed/...\n");

  for (const image of images) {
    await compressImage(image.path, image.path);
  }

  console.log("✨ All images compressed successfully!");
}

main().catch(console.error);

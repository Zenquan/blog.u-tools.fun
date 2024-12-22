import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ICONS_DIR = path.join(__dirname, '../public/icons');

// 确保目录存在
if (!fs.existsSync(ICONS_DIR)){
    fs.mkdirSync(ICONS_DIR, { recursive: true });
}

const sizes = [
  16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 384, 512
];

async function generateIcons() {
  const svgBuffer = fs.readFileSync(path.join(ICONS_DIR, 'favicon.png'));

  // 生成 favicon.ico (包含多个尺寸)
  await sharp(svgBuffer)
    .resize(16)
    .toFile(path.join(ICONS_DIR, '../favicon.ico'));

  // 生成各种尺寸的 PNG
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size)
      .png()
      .toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`));
  }

  // 特别生成 apple-touch-icon
  await sharp(svgBuffer)
    .resize(180)
    .png()
    .toFile(path.join(ICONS_DIR, 'apple-touch-icon-180x180.png'));

  console.log('Icons generated successfully!');
}

generateIcons().catch(console.error); 
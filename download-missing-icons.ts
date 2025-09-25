import https from 'https';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const missingIcons = [
  { id: 1219450, iconName: 'ability_mage_arcanebarrage' }, // Manifest Matrices - Plexus Sentinel
  { id: 1227052, iconName: 'inv_cosmicvoid_missile' }, // Void Burst - Soulbinder Naazindhri
  { id: 1228502, iconName: 'ability_mage_netherwindpresence' }, // Overwhelming Power - Forgeweaver Araz
  { id: 1227809, iconName: 'inv_ability_demonhunter_thehunt' } // The Hunt - The Soul Hunters
];

async function downloadIcon(icon: { id: number; iconName: string }): Promise<void> {
  const filePath = path.join('static', 'icons', `${icon.id}.jpg`);

  // Skip if JPG already exists
  if (fs.existsSync(filePath)) {
    console.log(`⏭️  JPG ${icon.id} already exists, skipping download`);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const url = `https://wow.zamimg.com/images/wow/icons/large/${icon.iconName}.jpg`;

    const file = fs.createWriteStream(filePath);
    const request = https.get(url, (response) => {
      if (response.statusCode === 404) {
        console.log(`❌ Icon ${icon.id} not found (404)`);
        file.close();
        fs.unlink(filePath, () => {});
        reject(new Error(`Icon ${icon.id} not found`));
        return;
      }

      if (response.statusCode !== 200) {
        console.log(`❌ Failed to download ${icon.id}: ${response.statusCode}`);
        file.close();
        fs.unlink(filePath, () => {});
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded ${icon.id}.jpg`);
        resolve();
      });
    });

    request.on('error', (err) => {
      file.close();
      fs.unlink(filePath, () => {});
      console.log(`❌ Error downloading ${icon.id}: ${err.message}`);
      reject(err);
    });
  });
}

async function convertToWebP(icon: { id: number; iconName: string }): Promise<void> {
  const inputPath = path.join('static', 'icons', `${icon.id}.jpg`);
  const outputPath = path.join('static', 'icons', `${icon.id}.webp`);

  // Skip if WebP already exists
  if (fs.existsSync(outputPath)) {
    console.log(`⏭️  WebP ${icon.id} already exists, skipping conversion`);
    return Promise.resolve();
  }

  // Skip if JPG doesn't exist
  if (!fs.existsSync(inputPath)) {
    console.log(`⏭️  JPG ${icon.id} not found, skipping conversion`);
    return Promise.resolve();
  }

  try {
    await sharp(inputPath)
      .webp()
      .toFile(outputPath);

    console.log(`✅ Converted ${icon.id} to WebP`);
    // Remove the original JPG
    fs.unlink(inputPath, () => {});
  } catch (error) {
    console.log(`❌ Failed to convert ${icon.id}: ${error}`);
    throw error;
  }
}

async function main() {
  console.log('Downloading missing boss ability icons...\n');

  for (const icon of missingIcons) {
    try {
      console.log(`Processing ${icon.id}...`);
      await downloadIcon(icon);
      await convertToWebP(icon);
      console.log(`✅ Completed ${icon.id}`);
    } catch (error) {
      console.log(`❌ Failed ${icon.id}: ${error}`);
      // Continue with next icon
    }

    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ Icon download and conversion complete!');
}

main().catch(console.error);
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createAPKPackage } from '../src/utils/androidPackageGenerator';
import { createIPAPackage } from '../src/utils/iosPackageGenerator';
import { DEFAULT_SALARY_CONFIG, DEFAULT_WEEKLY_SCHEDULE, getDefaultLeaves } from '../src/utils/storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('Generating WageTicker Android APK and iOS packages...');
  
  const config = DEFAULT_SALARY_CONFIG;
  const schedule = DEFAULT_WEEKLY_SCHEDULE;
  const leaves = getDefaultLeaves();

  const publicDir = path.resolve(__dirname, '../public');
  const artifactDir = '/.aistudio/artifacts/brain/75c5a839-4bc0-44e0-9de2-ace48012b244';

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  // 1. Generate APK
  console.log('Generating WageTicker.apk...');
  const apkBlob = await createAPKPackage(config, schedule, leaves);
  const apkBuffer = Buffer.from(await apkBlob.arrayBuffer());
  
  fs.writeFileSync(path.join(publicDir, 'WageTicker.apk'), apkBuffer);
  fs.writeFileSync(path.join(artifactDir, 'WageTicker.apk'), apkBuffer);
  console.log(`Saved WageTicker.apk (${apkBuffer.length} bytes) to public/ and artifact directory.`);

  // 2. Generate Android Studio Project zip
  fs.writeFileSync(path.join(publicDir, 'WageTicker-Android-Studio-Project.zip'), apkBuffer);
  fs.writeFileSync(path.join(artifactDir, 'WageTicker-Android-Studio-Project.zip'), apkBuffer);

  // 3. Generate IPA
  console.log('Generating WageTicker.ipa...');
  const ipaBlob = await createIPAPackage(config, schedule, leaves);
  const ipaBuffer = Buffer.from(await ipaBlob.arrayBuffer());
  fs.writeFileSync(path.join(publicDir, 'WageTicker.ipa'), ipaBuffer);
  fs.writeFileSync(path.join(artifactDir, 'WageTicker.ipa'), ipaBuffer);
  console.log(`Saved WageTicker.ipa (${ipaBuffer.length} bytes) to public/ and artifact directory.`);

  console.log('All packages generated successfully!');
}

main().catch((err) => {
  console.error('Packaging failed:', err);
  process.exit(1);
});

import * as fs from 'fs/promises';

const path = process.argv[2];
for (const file of await fs.readdir(path, { withFileTypes: true })) {
  // skip directories
  if (file.isDirectory()) continue;
  // get creation year, month
  const { birthtime } = await fs.stat(`${path}/${file.name}`);
  // two digit year
  const year = String(birthtime.getFullYear()).slice(-2);
  const month = String(birthtime.getMonth() + 1).padStart(2, '0');
  // create month directory if it doesn't exist
  const monthDir = `${path}/${year}-${month}`;
  try {
    await fs.readdir(monthDir);
  } catch (err) {
    await fs.mkdir(monthDir);
  }
  // move file to month directory
  await fs.rename(`${path}/${file.name}`, `${monthDir}/${file.name}`);
  // console.log(`mv ${path}/${file.name} ${monthDir}/${file.name}`);
}


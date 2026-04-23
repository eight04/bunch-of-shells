import * as fs from 'fs/promises';

// splitter <type> <path>
const [type, path] = process.argv.slice(2);
for (const file of await fs.readdir(path, { withFileTypes: true })) {
  // skip directories
  if (file.isDirectory()) continue;
  const dir = getSubdir(file, type);
  const subDir = `${path}/${dir}`;
  try {
    await fs.readdir(subDir);
  } catch (err) {
    await fs.mkdir(subDir);
  }
  await fs.rename(`${path}/${file.name}`, `${subDir}/${file.name}`);
}

function getSubdir(file, type) {
  if (type === 'ext') {
    return file.name.split('.').slice(-1)[0];
  }
  if (type === 'month') {
    const date = new Date(file.birthtime);
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
  throw new Error('Invalid type');
}

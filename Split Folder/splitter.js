import * as fs from 'fs/promises';

// splitter <type> <path>
const [type, path] = process.argv.slice(2);
for (const file of await fs.readdir(path)) {
  // skip directories
  const stats = await fs.stat(`${path}/${file}`);
  if (stats.isDirectory()) continue;
  const dir = getSubdir(type, file, stats);
  const subDir = `${path}/${dir}`;
  try {
    await fs.readdir(subDir);
  } catch (err) {
    await fs.mkdir(subDir);
  }
  await fs.rename(`${path}/${file}`, `${subDir}/${file}`);
}

function getSubdir(type, file, stats) {
  if (type === 'ext') {
    return file.split('.').slice(-1)[0];
  }
  if (type === 'month') {
    const date = smallest([stats.birthtime, stats.mtime], d => d.getTime());
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const output = `${year}-${month}`;
    if (!output.match(/\d{2}-\d{2}/)) {
      throw new Error(`Invalid date format for file ${file}, expected YY-MM, got ${output}, birthtime: ${stats.birthtime}, mtime: ${stats.mtime}`);
    }
    return output;
  }
  throw new Error('Invalid type');
}

function smallest(arr, fn) {
  let smallestValue = fn(arr[0]);
  let smallestItem = arr[0];
  for (const item of arr) {
    const value = fn(item);
    if (value < smallestValue) {
      smallestValue = value;
      smallestItem = item;
    }
  }
  return smallestItem;
}

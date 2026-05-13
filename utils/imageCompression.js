const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const ONE_MB = 1024 * 1024;
const MIN_QUALITY = 35;
const MIN_WIDTH = 480;

const getUploadedFiles = (req) => {
  const files = [];

  if (req.file) {
    files.push(req.file);
  }

  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === 'object') {
    Object.values(req.files).forEach((fieldFiles) => {
      if (Array.isArray(fieldFiles)) {
        files.push(...fieldFiles);
      }
    });
  }

  return files;
};

const updateFileMetadata = async (file, compressedPath) => {
  const parsedPath = path.parse(file.path);
  const jpegPath = path.join(parsedPath.dir, `${parsedPath.name}.jpg`);

  if (file.path !== jpegPath) {
    await fs.rename(compressedPath, jpegPath);
    await fs.rm(file.path, { force: true });
  }

  file.path = jpegPath;
  file.filename = path.basename(jpegPath);
  file.mimetype = 'image/jpeg';
  file.size = (await fs.stat(jpegPath)).size;
};

const createCompressedBuffer = async (file, width, quality) => {
  return sharp(file.path, { failOn: 'none' })
    .rotate()
    .resize({
      width,
      fit: 'inside',
      withoutEnlargement: true
    })
    .flatten({ background: '#ffffff' })
    .jpeg({
      quality,
      mozjpeg: true,
      progressive: true
    })
    .toBuffer();
};

const compressImageFile = async (file, targetSize = ONE_MB) => {
  if (!file?.path || !file.mimetype?.startsWith('image/')) {
    return;
  }

  const metadata = await sharp(file.path, { failOn: 'none' }).metadata();
  let width = Math.min(metadata.width || 1920, 1920);
  let quality = 82;
  let bestBuffer = null;

  while (width >= MIN_WIDTH) {
    while (quality >= MIN_QUALITY) {
      const buffer = await createCompressedBuffer(file, width, quality);
      bestBuffer = buffer;

      if (buffer.length <= targetSize) {
        await fs.writeFile(file.path, buffer);
        await updateFileMetadata(file, file.path);
        return;
      }

      quality -= 8;
    }

    width = Math.floor(width * 0.8);
    quality = 74;
  }

  if (bestBuffer) {
    await fs.writeFile(file.path, bestBuffer);
    await updateFileMetadata(file, file.path);
  }
};

const compressUploadedImages = (options = {}) => async (req, res, next) => {
  try {
    const files = getUploadedFiles(req);

    await Promise.all(
      files.map(file => compressImageFile(file, options.targetSize || ONE_MB))
    );

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  ONE_MB,
  compressUploadedImages
};

const fs = require('fs');
const path = require('path');

const uploadRoot = path.resolve(
  process.env.UPLOAD_ROOT || path.join(__dirname, '..', 'uploads')
);

const ensureUploadDir = (subDir = '') => {
  const targetDir = path.join(uploadRoot, subDir);
  fs.mkdirSync(targetDir, { recursive: true });
  return targetDir;
};

const publicUploadPath = (subDir, filename) => {
  const cleanSubDir = String(subDir || '').replace(/^\/+|\/+$/g, '');
  return `/uploads/${cleanSubDir ? `${cleanSubDir}/` : ''}${filename}`;
};

const getFileSystemPath = (publicPath = '') => {
  if (!publicPath) return '';

  const normalizedPath = String(publicPath).replace(/\\/g, '/');
  const uploadPath = normalizedPath.replace(/^\/?api\/uploads\//, '/uploads/');

  if (uploadPath.startsWith('uploads/')) {
    return path.join(uploadRoot, uploadPath.replace(/^uploads\//, ''));
  }

  if (!uploadPath.startsWith('/uploads/')) {
    return path.resolve(uploadPath);
  }

  return path.join(uploadRoot, uploadPath.replace(/^\/uploads\//, ''));
};

module.exports = {
  uploadRoot,
  ensureUploadDir,
  publicUploadPath,
  getFileSystemPath
};

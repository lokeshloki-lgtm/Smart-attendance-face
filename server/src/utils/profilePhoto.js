import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const currentFile = fileURLToPath(import.meta.url);
const serverRoot = path.resolve(path.dirname(currentFile), '../..');
const uploadDirectory = path.join(serverRoot, 'uploads', 'profile-photos');

export const saveProfilePhoto = async (photo) => {
  if (!photo) return null;
  if (photo.startsWith('/uploads/')) return photo;
  if (!photo.startsWith('data:image/')) throw new Error('Profile photo must be an image');

  const match = photo.match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);
  if (!match) throw new Error('Unsupported profile photo format');

  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  await fs.mkdir(uploadDirectory, { recursive: true });
  const filename = `profile-${randomUUID()}.${extension}`;
  await fs.writeFile(path.join(uploadDirectory, filename), Buffer.from(match[2], 'base64'));

  return `/uploads/profile-photos/${filename}`;
};

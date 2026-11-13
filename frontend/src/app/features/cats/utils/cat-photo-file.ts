export const CAT_PHOTO_ACCEPT =
  '.jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif';

const MAX_PHOTO_BYTES = 32 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);
const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);
const GENERIC_TYPES = new Set(['', 'application/octet-stream']);

export function catPhotoFileError(
  file: File,
): 'localFileTooLarge' | 'localUnsupportedFormat' | null {
  if (file.size > MAX_PHOTO_BYTES) return 'localFileTooLarge';
  const type = file.type.toLowerCase();
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mimeClearlyUnsupported = !GENERIC_TYPES.has(type) && !ACCEPTED_TYPES.has(type);
  const extensionClearlyUnsupported = extension !== '' && !ACCEPTED_EXTENSIONS.has(extension);
  return mimeClearlyUnsupported && extensionClearlyUnsupported ? 'localUnsupportedFormat' : null;
}

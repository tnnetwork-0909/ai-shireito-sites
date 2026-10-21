import { INPUT_LIMITS } from './config.js';

// Check the file signature as well as the browser-supplied MIME type. The
// decoder still has the final say about whether the image is readable.
export function headerMatchesPhotoType(type, header) {
  const bytes = header instanceof Uint8Array ? header : new Uint8Array(header);
  if (type === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  if (type === 'image/webp') {
    const ascii = (from, to) => String.fromCharCode(...bytes.slice(from, to));
    return bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
  }
  return false;
}

export async function validatePhotoFile(file) {
  if (!file) return 'photoMissing';
  if (!INPUT_LIMITS.photoTypes.includes(file.type)) return 'photoType';
  if (file.size > INPUT_LIMITS.photoMaxBytes) return 'photoTooLarge';
  if (file.size === 0) return 'photoUnreadable';
  try {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    return headerMatchesPhotoType(file.type, header) ? null : 'photoType';
  } catch {
    return 'photoUnreadable';
  }
}

import { IMAGE, PRINT } from './config.js';

export function canvasToJpeg(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob && blob.type === IMAGE.mimeType) resolve(blob);
      else reject(new Error('JPEG export failed'));
    }, IMAGE.mimeType, IMAGE.quality);
  });
}

// Check the encoded image itself before declaring its size in the PDF. A
// mismatched /Width or /Height would make the printed resolution misleading.
export function jpegDimensions(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error('Invalid JPEG');
  }
  let at = 2;
  while (at < bytes.length) {
    if (bytes[at++] !== 0xff) break;
    while (bytes[at] === 0xff) at += 1;
    const marker = bytes[at++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (at + 2 > bytes.length) break;
    const length = (bytes[at] << 8) | bytes[at + 1];
    if (length < 2 || at + length > bytes.length) break;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      if (length < 7) break;
      return {
        width: (bytes[at + 5] << 8) | bytes[at + 6],
        height: (bytes[at + 3] << 8) | bytes[at + 4],
      };
    }
    at += length;
  }
  throw new Error('JPEG dimensions unavailable');
}

// A small PDF writer: one 6 x 4 in page holding the exact exported JPEG.
// Byte offsets are counted after UTF-8 encoding, as required by the xref table.
export function pdfBytesFromJpeg(jpegBytes) {
  const dimensions = jpegDimensions(jpegBytes);
  if (dimensions.width !== IMAGE.widthPx || dimensions.height !== IMAGE.heightPx) {
    throw new Error('JPEG dimensions do not match the print canvas');
  }
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let length = 0;
  const append = (chunk) => {
    const bytes = typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (number, body) => {
    offsets[number] = length;
    append(`${number} 0 obj\n${body}\nendobj\n`);
  };

  append('%PDF-1.4\n');
  append(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PRINT.widthPt} ${PRINT.heightPt}] /TrimBox [0 0 ${PRINT.widthPt} ${PRINT.heightPt}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = length;
  append(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${IMAGE.widthPx} /Height ${IMAGE.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  append(jpegBytes);
  append('\nendstream\nendobj\n');
  const drawing = `q\n${PRINT.widthPt} 0 0 ${PRINT.heightPt} 0 0 cm\n/Im0 Do\nQ\n`;
  const drawingBytes = encoder.encode(drawing);
  offsets[5] = length;
  append(`5 0 obj\n<< /Length ${drawingBytes.length} >>\nstream\n`);
  append(drawingBytes);
  append('endstream\nendobj\n');
  const xrefAt = length;
  append('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i += 1) append(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  append(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

  const output = new Uint8Array(length);
  let at = 0;
  for (const chunk of chunks) {
    output.set(chunk, at);
    at += chunk.length;
  }
  return output;
}

export async function pdfFromJpeg(jpegBlob) {
  return new Blob([pdfBytesFromJpeg(new Uint8Array(await jpegBlob.arrayBuffer()))], { type: 'application/pdf' });
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Some browsers resolve a download just after the click returns.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

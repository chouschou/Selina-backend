import * as sharp from 'sharp';
import axios from 'axios';
import { Readable } from 'stream';
// Import đúng cách
import * as FormData from 'form-data';
import * as dotenv from 'dotenv';
// import sharp = require('sharp');
dotenv.config();

// Tạo instance
// const form = new FormData();

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

if (!REMOVE_BG_API_KEY) {
  console.log('Missing REMOVE_BG_API_KEY in .env');
}

// Gửi ảnh đến remove.bg, trả về buffer ảnh đã xóa nền
export async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  const form = new FormData();
  form.append('image_file', imageBuffer, {
    filename: 'image.png',
  });
  form.append('size', 'auto');

  const response = await axios.post(
    'https://api.remove.bg/v1.0/removebg',
    form,
    {
      headers: {
        ...form.getHeaders(),
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      responseType: 'arraybuffer',
    },
  );

  if (response.status !== 200) {
    throw new Error(`remove.bg error: ${response.statusText}`);
  }

  return Buffer.from(response.data);
}

// Resize/crop ảnh về tỉ lệ 2:1 (cắt giữa ảnh)
export async function cropTo2_1(imageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const { width, height } = metadata;

  if (!width || !height) throw new Error('Invalid image dimensions');

  const targetRatio = 2.0;
  const currentRatio = width / height;

  if (Math.abs(currentRatio - targetRatio) <= 0.05) {
    return imageBuffer;
  }

  if (currentRatio > targetRatio) {
    // Cắt ngang
    const newWidth = Math.floor(height * targetRatio);
    const left = Math.floor((width - newWidth) / 2);
    const result: Buffer = await sharp(imageBuffer)
      .extract({ left, top: 0, width: newWidth, height })
      .toBuffer();
    return result;
  } else {
    // Cắt dọc
    const newHeight = Math.floor(width / targetRatio);
    const top = Math.floor((height - newHeight) / 2);
    const result: Buffer = await sharp(imageBuffer)
      .extract({ left: 0, top, width, height: newHeight })
      .toBuffer();
    return result;
  }
}

// Tổng xử lý: xóa nền + crop
export async function processModelImage(fileBuffer: Buffer): Promise<Buffer> {
  const noBg = await removeBackground(fileBuffer);
  const cropped = await cropTo2_1(noBg);
  return cropped;
}

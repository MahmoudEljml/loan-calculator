export type CardSide = 'front' | 'back';

export interface ProcessedCardImage {
  blob: Blob;
  rotation: number;
  cropped: boolean;
  width: number;
  height: number;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CARD_OUTPUT_WIDTH = 1586;
const CARD_OUTPUT_HEIGHT = 1000;

const arabicDigits = '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹';
const westernDigits = '01234567890123456789';

export function normalizeDigits(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const index = arabicDigits.indexOf(digit);
    return westernDigits[index] ?? digit;
  });
}

function createIntegralMap(values: Float32Array, width: number, height: number) {
  const stride = width + 1;
  const integral = new Float64Array(stride * (height + 1));
  for (let y = 1; y <= height; y += 1) {
    let rowSum = 0;
    for (let x = 1; x <= width; x += 1) {
      rowSum += values[(y - 1) * width + x - 1];
      integral[y * stride + x] = integral[(y - 1) * stride + x] + rowSum;
    }
  }
  return integral;
}

function sumRectangle(
  integral: Float64Array,
  width: number,
  x: number,
  y: number,
  rectangleWidth: number,
  rectangleHeight: number,
) {
  const stride = width + 1;
  const right = x + rectangleWidth;
  const bottom = y + rectangleHeight;
  return integral[bottom * stride + right]
    - integral[y * stride + right]
    - integral[bottom * stride + x]
    + integral[y * stride + x];
}

function findCardBounds(bitmap: ImageBitmap): Bounds | null {
  const scale = Math.min(1, 480 / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(bitmap, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const grayscale = new Float32Array(width * height);
  for (let index = 0, pixel = 0; index < pixels.length; index += 4, pixel += 1) {
    grayscale[pixel] = pixels[index] * 0.3 + pixels[index + 1] * 0.59 + pixels[index + 2] * 0.11;
  }

  const verticalEdges = new Float32Array(grayscale.length);
  const horizontalEdges = new Float32Array(grayscale.length);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      verticalEdges[index] = Math.abs(grayscale[index + 1] - grayscale[index - 1]);
      horizontalEdges[index] = Math.abs(grayscale[index + width] - grayscale[index - width]);
    }
  }
  const verticalIntegral = createIntegralMap(verticalEdges, width, height);
  const horizontalIntegral = createIntegralMap(horizontalEdges, width, height);
  const step = Math.max(3, Math.round(Math.min(width, height) / 70));
  const minWidth = Math.max(36, Math.round(width * 0.24));
  const maxWidth = width - 6;
  const ratios = [1.48, 1.53, 1.586, 1.64, 1.7, 1 / 1.48, 1 / 1.53, 1 / 1.586, 1 / 1.64, 1 / 1.7];
  let best: { x: number; y: number; width: number; height: number; score: number } | null = null;

  for (const ratio of ratios) {
    const largestWidth = Math.min(maxWidth, Math.floor((height - 6) * ratio));
    const widthStep = Math.max(3, Math.round(width / 90));
    for (let rectangleWidth = minWidth; rectangleWidth <= largestWidth; rectangleWidth += widthStep) {
      const rectangleHeight = Math.round(rectangleWidth / ratio);
      if (rectangleHeight < 30 || rectangleHeight > height - 6) continue;

      for (let y = 3; y + rectangleHeight < height - 3; y += step) {
        for (let x = 3; x + rectangleWidth < width - 3; x += step) {
          const areaRatio = (rectangleWidth * rectangleHeight) / (width * height);
          if (areaRatio < 0.08 || areaRatio > 0.88) continue;

          const verticalScore = (
            sumRectangle(verticalIntegral, width, x - 1, y + 2, 2, rectangleHeight - 4) +
            sumRectangle(verticalIntegral, width, x + rectangleWidth - 1, y + 2, 2, rectangleHeight - 4)
          );
          const horizontalScore = (
            sumRectangle(horizontalIntegral, width, x + 2, y - 1, rectangleWidth - 4, 2) +
            sumRectangle(horizontalIntegral, width, x + 2, y + rectangleHeight - 1, rectangleWidth - 4, 2)
          );
          const perimeter = 4 * (rectangleWidth + rectangleHeight) - 16;
          const edgeScore = (verticalScore + horizontalScore) / perimeter;
          const centerX = (x + rectangleWidth / 2) / width;
          const centerY = (y + rectangleHeight / 2) / height;
          const centerPenalty = 1 - 0.12 * (Math.abs(centerX - 0.5) + Math.abs(centerY - 0.5));
          const score = edgeScore * centerPenalty;
          if (!best || score > best.score) {
            best = { x, y, width: rectangleWidth, height: rectangleHeight, score };
          }
        }
      }
    }
  }

  if (!best || best.score < 13) return null;
  const inset = Math.max(1, Math.round(Math.min(best.width, best.height) * 0.008));
  const x = Math.round((best.x + inset) / scale);
  const y = Math.round((best.y + inset) / scale);
  const right = Math.round((best.x + best.width - inset) / scale);
  const bottom = Math.round((best.y + best.height - inset) / scale);
  return { x, y, width: right - x, height: bottom - y };
}

function rotateCanvas(source: HTMLCanvasElement, degrees: number) {
  const quarterTurn = degrees === 90 || degrees === 270;
  const canvas = document.createElement('canvas');
  canvas.width = quarterTurn ? source.height : source.width;
  canvas.height = quarterTurn ? source.width : source.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('تعذر تجهيز الصورة للتدوير');
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((degrees * Math.PI) / 180);
  context.drawImage(source, -source.width / 2, -source.height / 2);
  return canvas;
}

function normalizeCardCanvas(source: HTMLCanvasElement) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_OUTPUT_WIDTH;
  canvas.height = CARD_OUTPUT_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('تعذر تجهيز أبعاد البطاقة');

  const targetRatio = CARD_OUTPUT_WIDTH / CARD_OUTPUT_HEIGHT;
  const sourceRatio = source.width / source.height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = source.width;
  let sourceHeight = source.height;
  if (sourceRatio > targetRatio) {
    sourceWidth = source.height * targetRatio;
    sourceX = (source.width - sourceWidth) / 2;
  } else {
    sourceHeight = source.width / targetRatio;
    sourceY = (source.height - sourceHeight) / 2;
  }

  context.imageSmoothingQuality = 'high';
  context.drawImage(
    source,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    CARD_OUTPUT_WIDTH,
    CARD_OUTPUT_HEIGHT,
  );
  return canvas;
}

async function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('تعذر حفظ الصورة بعد المعالجة')),
      mimeType,
      0.96,
    );
  });
}

export async function processCardImage(file: Blob): Promise<ProcessedCardImage> {
  const bitmap = await createImageBitmap(file);
  try {
    const bounds = findCardBounds(bitmap);
    const crop = document.createElement('canvas');
    crop.width = bounds?.width ?? bitmap.width;
    crop.height = bounds?.height ?? bitmap.height;
    const cropContext = crop.getContext('2d');
    if (!cropContext) throw new Error('تعذر تجهيز مساحة قص البطاقة');
    cropContext.drawImage(
      bitmap,
      bounds?.x ?? 0,
      bounds?.y ?? 0,
      bounds?.width ?? bitmap.width,
      bounds?.height ?? bitmap.height,
      0,
      0,
      crop.width,
      crop.height,
    );

    const rotation = crop.height > crop.width ? 90 : 0;
    const oriented = rotation ? rotateCanvas(crop, rotation) : crop;
    const normalized = normalizeCardCanvas(oriented);
    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await canvasToBlob(normalized, outputType);

    return {
      blob,
      rotation,
      cropped: Boolean(bounds),
      width: normalized.width,
      height: normalized.height,
    };
  } finally {
    bitmap.close();
  }
}

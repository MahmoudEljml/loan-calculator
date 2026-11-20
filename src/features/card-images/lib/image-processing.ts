export type CardSide = 'front' | 'back';

export interface CropSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProcessedCardImage {
  blob: Blob;
  width: number;
  height: number;
}

export interface ImageTransform {
  rotation: number;
  tiltX: number;
  tiltY: number;
}

interface ImageFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

async function decodeImage(file: Blob): Promise<DecodedImage> {
  try {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('تعذر فتح صيغة الصورة في هذا المتصفح'));
        element.src = url;
      });
      return {
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        close: () => URL.revokeObjectURL(url),
      };
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('تعذر حفظ الصورة بعد التعديل')),
      mimeType,
      0.96,
    );
  });
}

function getOutputType(file: Blob) {
  return file.type === 'image/png' ? 'image/png' : 'image/jpeg';
}

export async function cropImage(
  file: Blob,
  selection: CropSelection,
  transform: ImageTransform,
): Promise<ProcessedCardImage> {
  const image = await decodeImage(file);
  const transformedCanvas = document.createElement('canvas');
  const croppedCanvas = document.createElement('canvas');
  try {
    const transformedSize = drawImageTransformToCanvas(
      transformedCanvas,
      image.source,
      image.width,
      image.height,
      transform,
    );
    const x = Math.max(0, Math.floor(selection.x * transformedSize.width));
    const y = Math.max(0, Math.floor(selection.y * transformedSize.height));
    const right = Math.min(
      transformedSize.width,
      Math.ceil((selection.x + selection.width) * transformedSize.width),
    );
    const bottom = Math.min(
      transformedSize.height,
      Math.ceil((selection.y + selection.height) * transformedSize.height),
    );
    const width = right - x;
    const height = bottom - y;
    if (width < 1 || height < 1) throw new Error('حدد مساحة صالحة لقص الصورة');

    croppedCanvas.width = width;
    croppedCanvas.height = height;
    const context = croppedCanvas.getContext('2d');
    if (!context) throw new Error('تعذر تجهيز القص اليدوي');
    if (getOutputType(file) === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(transformedCanvas, x, y, width, height, 0, 0, width, height);

    return { blob: await canvasToBlob(croppedCanvas, getOutputType(file)), width, height };
  } finally {
    image.close();
    transformedCanvas.width = 0;
    transformedCanvas.height = 0;
    croppedCanvas.width = 0;
    croppedCanvas.height = 0;
  }
}

export async function rotateImage(
  file: Blob,
  degrees: 90 | -90,
): Promise<ProcessedCardImage> {
  const image = await decodeImage(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = image.height;
    canvas.height = image.width;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('تعذر تجهيز الصورة للتدوير');
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((degrees * Math.PI) / 180);
    context.drawImage(image.source, -image.width / 2, -image.height / 2);

    return {
      blob: await canvasToBlob(canvas, getOutputType(file)),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    image.close();
  }
}

function getContainedFrame(imageWidth: number, imageHeight: number, frame: ImageFrame): ImageFrame {
  const scale = Math.min(frame.width / imageWidth, frame.height / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    x: frame.x + (frame.width - width) / 2,
    y: frame.y + (frame.height - height) / 2,
    width,
    height,
  };
}

function projectPoint(point: Point, center: Point, frame: ImageFrame, transform: ImageTransform): Point {
  const radians = Math.PI / 180;
  const rotation = transform.rotation * radians;
  const tiltX = transform.tiltX * radians;
  const tiltY = transform.tiltY * radians;
  const cosRotation = Math.cos(rotation);
  const sinRotation = Math.sin(rotation);
  const rotatedX = (point.x - center.x) * cosRotation - (point.y - center.y) * sinRotation;
  const rotatedY = (point.x - center.x) * sinRotation + (point.y - center.y) * cosRotation;

  const rotatedByY = rotatedX * Math.cos(tiltY);
  const depthByY = -rotatedX * Math.sin(tiltY);
  const rotatedByX = rotatedY * Math.cos(tiltX) - depthByY * Math.sin(tiltX);
  const depth = rotatedY * Math.sin(tiltX) + depthByY * Math.cos(tiltX);
  const distance = Math.max(frame.width, frame.height) * 3;
  const perspective = distance / (distance - depth);

  return {
    x: center.x + rotatedByY * perspective,
    y: center.y + rotatedByX * perspective,
  };
}

function getProjectedCorners(
  imageWidth: number,
  imageHeight: number,
  frame: ImageFrame,
  transform: ImageTransform,
) {
  const contained = getContainedFrame(imageWidth, imageHeight, frame);
  const center = {
    x: contained.x + contained.width / 2,
    y: contained.y + contained.height / 2,
  };
  return [
    { x: contained.x, y: contained.y },
    { x: contained.x + contained.width, y: contained.y },
    { x: contained.x + contained.width, y: contained.y + contained.height },
    { x: contained.x, y: contained.y + contained.height },
  ].map((point) => projectPoint(point, center, frame, transform));
}

export function getPerspectiveBounds(
  imageWidth: number,
  imageHeight: number,
  frame: ImageFrame,
  transform: ImageTransform,
) {
  const points = getProjectedCorners(imageWidth, imageHeight, frame, transform);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function drawTriangle(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  source: [Point, Point, Point],
  destination: [Point, Point, Point],
  origin: Point,
) {
  const [s0, s1, s2] = source;
  const [d0Source, d1Source, d2Source] = destination;
  const d0 = { x: d0Source.x + origin.x, y: d0Source.y + origin.y };
  const d1 = { x: d1Source.x + origin.x, y: d1Source.y + origin.y };
  const d2 = { x: d2Source.x + origin.x, y: d2Source.y + origin.y };
  const sourceDx1 = s1.x - s0.x;
  const sourceDy1 = s1.y - s0.y;
  const sourceDx2 = s2.x - s0.x;
  const sourceDy2 = s2.y - s0.y;
  const determinant = sourceDx1 * sourceDy2 - sourceDx2 * sourceDy1;
  if (Math.abs(determinant) < 0.001) return;

  const a = ((d1.x - d0.x) * sourceDy2 - (d2.x - d0.x) * sourceDy1) / determinant;
  const c = (sourceDx1 * (d2.x - d0.x) - sourceDx2 * (d1.x - d0.x)) / determinant;
  const e = d0.x - a * s0.x - c * s0.y;
  const b = ((d1.y - d0.y) * sourceDy2 - (d2.y - d0.y) * sourceDy1) / determinant;
  const d = (sourceDx1 * (d2.y - d0.y) - sourceDx2 * (d1.y - d0.y)) / determinant;
  const f = d0.y - b * s0.x - d * s0.y;

  context.save();
  context.beginPath();
  context.moveTo(d0.x, d0.y);
  context.lineTo(d1.x, d1.y);
  context.lineTo(d2.x, d2.y);
  context.closePath();
  context.clip();
  context.setTransform(a, b, c, d, e, f);
  context.drawImage(image, 0, 0);
  context.restore();
}

export function drawPerspectiveImage(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  frame: ImageFrame,
  transform: ImageTransform,
  origin: Point,
) {
  const contained = getContainedFrame(imageWidth, imageHeight, frame);
  const center = {
    x: contained.x + contained.width / 2,
    y: contained.y + contained.height / 2,
  };
  if (transform.tiltX === 0 && transform.tiltY === 0) {
    context.save();
    context.translate(center.x + origin.x, center.y + origin.y);
    context.rotate((transform.rotation * Math.PI) / 180);
    context.drawImage(
      image,
      -contained.width / 2,
      -contained.height / 2,
      contained.width,
      contained.height,
    );
    context.restore();
    return;
  }

  const columns = Math.max(8, Math.min(24, Math.ceil(frame.width / 70)));
  const rows = Math.max(6, Math.min(16, Math.ceil(frame.height / 70)));
  const projectedPoints = Array.from({ length: rows + 1 }, (_, row) => (
    Array.from({ length: columns + 1 }, (_, column) => projectPoint({
      x: contained.x + (column / columns) * contained.width,
      y: contained.y + (row / rows) * contained.height,
    }, center, frame, transform))
  ));

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const u0 = column / columns;
      const u1 = (column + 1) / columns;
      const v0 = row / rows;
      const v1 = (row + 1) / rows;
      const sourceX0 = u0 * imageWidth;
      const sourceX1 = u1 * imageWidth;
      const sourceY0 = v0 * imageHeight;
      const sourceY1 = v1 * imageHeight;
      const p00 = projectedPoints[row][column];
      const p10 = projectedPoints[row][column + 1];
      const p11 = projectedPoints[row + 1][column + 1];
      const p01 = projectedPoints[row + 1][column];

      drawTriangle(context, image, [
        { x: sourceX0, y: sourceY0 },
        { x: sourceX1, y: sourceY0 },
        { x: sourceX1, y: sourceY1 },
      ], [p00, p10, p11], origin);
      drawTriangle(context, image, [
        { x: sourceX0, y: sourceY0 },
        { x: sourceX1, y: sourceY1 },
        { x: sourceX0, y: sourceY1 },
      ], [p00, p11, p01], origin);
    }
  }
}

export function drawImageTransformToCanvas(
  canvas: HTMLCanvasElement,
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  transform: ImageTransform,
) {
  const frame = { x: 0, y: 0, width: imageWidth, height: imageHeight };
  const bounds = getPerspectiveBounds(imageWidth, imageHeight, frame, transform);
  const width = Math.max(1, Math.ceil(bounds.width - 0.000001));
  const height = Math.max(1, Math.ceil(bounds.height - 0.000001));
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('تعذر تجهيز معاينة التحويلات');
  context.clearRect(0, 0, width, height);
  drawPerspectiveImage(
    context,
    image,
    imageWidth,
    imageHeight,
    frame,
    transform,
    { x: -bounds.x, y: -bounds.y },
  );
  return { width, height };
}

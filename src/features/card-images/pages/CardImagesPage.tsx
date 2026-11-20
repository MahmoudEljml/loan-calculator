import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpDown,
  Check,
  Download,
  Crop,
  Images,
  Link2,
  History,
  RotateCcw,
  RotateCw,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  cropImage,
  drawImageTransformToCanvas,
  drawPerspectiveImage,
  rotateImage,
  type CropSelection,
  type CardSide,
  type ImageTransform,
} from '../lib/image-processing';

interface CardPhoto {
  id: string;
  name: string;
  url: string;
  blob: Blob;
  side: CardSide | null;
  rotation: number;
  cropped: boolean;
  width: number;
  height: number;
  originalBlob: Blob;
  originalWidth: number;
  originalHeight: number;
}

interface CropPreviewSource {
  url: string;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

interface GroupedCard {
  id: string;
  frontPhotoId?: string;
  backPhotoId?: string;
}

const CARD_WIDTH = 1586;
const CARD_HEIGHT = 1000;
const A4_WIDTH = 2480;
const A4_HEIGHT = 3508;
const A4_MARGIN = 100;
const PREVIEW_WIDTH = 900;
const COLLAGE_GAP_RATIO = 0.024;
type TransformKey = keyof ImageTransform;

const DEFAULT_IMAGE_TRANSFORM: ImageTransform = {
  rotation: 0,
  tiltX: 0,
  tiltY: 0,
};

const TRANSFORM_CONTROLS: {
  key: TransformKey;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}[] = [
  { key: 'rotation', label: 'زاوية التدوير الدقيقة', min: -90, max: 90, step: 0.5, unit: '°' },
  { key: 'tiltX', label: 'إمالة أفقية بالمنظور', min: -35, max: 35, step: 1, unit: '°' },
  { key: 'tiltY', label: 'إمالة رأسية بالمنظور', min: -35, max: 35, step: 1, unit: '°' },
];

function createDownloadFileName(index: number, extension: string) {
  const date = new Date();
  const dateKey = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  return `card-collage-${dateKey}-${index + 1}-${crypto.randomUUID()}.${extension}`;
}

function PhotoTransformControls({
  transform,
  onChange,
  onReset,
  disabled = false,
}: {
  transform: ImageTransform;
  onChange: (key: TransformKey, value: number) => void;
  onReset: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="shrink-0 rounded-md border bg-muted/40 p-2 sm:p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium sm:text-sm">ضبط الدوران والمنظور</h3>
        <Button type="button" size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={onReset} disabled={disabled}>
          <RotateCcw className="size-3.5" />
          إعادة الضبط
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-3">
        {TRANSFORM_CONTROLS.map((control) => (
          <label key={control.key} className="block min-w-0 space-y-0.5 text-[11px]">
            <span className="flex items-center justify-between gap-1">
              <span>{control.label}</span>
              <span dir="ltr">{transform[control.key]}{control.unit}</span>
            </span>
            <input
              type="range"
              min={control.min}
              max={control.max}
              step={control.step}
              value={transform[control.key]}
              disabled={disabled}
              onChange={(event) => onChange(control.key, Number(event.target.value))}
              className="h-4 w-full accent-primary"
              aria-label={control.label}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('تعذر تحميل إحدى صور البطاقة'));
    image.src = url;
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function drawCollage(
  canvas: HTMLCanvasElement,
  front: HTMLImageElement,
  back: HTMLImageElement,
  frameWidth: number,
) {
  const pageScale = frameWidth / A4_WIDTH;
  const pageHeight = A4_HEIGHT * pageScale;
  const margin = A4_MARGIN * pageScale;
  const contentWidth = frameWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;
  const frameScale = Math.min(
    contentWidth / CARD_WIDTH,
    contentHeight / (CARD_HEIGHT * (2 + COLLAGE_GAP_RATIO)),
  );
  const slotWidth = CARD_WIDTH * frameScale;
  const slotHeight = CARD_HEIGHT * frameScale;
  const scaledGap = slotHeight * COLLAGE_GAP_RATIO;
  const frameX = (frameWidth - slotWidth) / 2;
  const frontY = (pageHeight - (slotHeight * 2 + scaledGap)) / 2;
  const frontFrame = { x: frameX, y: frontY, width: slotWidth, height: slotHeight };
  const backFrame = {
    x: frameX,
    y: frontY + slotHeight + scaledGap,
    width: slotWidth,
    height: slotHeight,
  };

  canvas.width = Math.round(frameWidth);
  canvas.height = Math.round(pageHeight);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('تعذر تجهيز معاينة البطاقة');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawPerspectiveImage(
    context,
    front,
    front.naturalWidth,
    front.naturalHeight,
    frontFrame,
    DEFAULT_IMAGE_TRANSFORM,
    { x: 0, y: 0 },
  );
  drawPerspectiveImage(
    context,
    back,
    back.naturalWidth,
    back.naturalHeight,
    backFrame,
    DEFAULT_IMAGE_TRANSFORM,
    { x: 0, y: 0 },
  );
}

function CombinedCardPreview({
  front,
  back,
  index,
}: {
  front: CardPhoto;
  back: CardPhoto;
  index: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [images, setImages] = useState<[HTMLImageElement, HTMLImageElement] | null>(null);

  useEffect(() => {
    let active = true;
    setIsReady(false);
    setPreviewError('');
    setImages(null);

    void Promise.all([loadImage(front.url), loadImage(back.url)])
      .then(([frontImage, backImage]) => {
        if (active) setImages([frontImage, backImage]);
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error('تعذر تركيب معاينة البطاقة:', error);
        setPreviewError('تعذر إنشاء المعاينة. حاول تدوير الصور أو قصّها ثم أعد المحاولة.');
      });

    return () => {
      active = false;
    };
  }, [front.url, back.url]);

  useEffect(() => {
    if (!images || !canvasRef.current) return;
    try {
      const [frontImage, backImage] = images;
      drawCollage(
        canvasRef.current,
        frontImage,
        backImage,
        PREVIEW_WIDTH,
      );
      setPreviewError('');
      setIsReady(true);
    } catch (error) {
      console.error('تعذر تركيب معاينة البطاقة:', error);
      setPreviewError('تعذر إنشاء المعاينة. حاول تدوير الصور أو قصّها ثم أعد المحاولة.');
      setIsReady(false);
    }
  }, [images]);

  const download = () => {
    if (!images || !isReady) return;
    const [frontImage, backImage] = images;
    const exportCanvas = document.createElement('canvas');
    try {
      drawCollage(
        exportCanvas,
        frontImage,
        backImage,
        A4_WIDTH,
      );
    } catch (error) {
      console.error('تعذر تجهيز صورة البطاقة للتحميل:', error);
      toast.error('تعذر تجهيز صورة البطاقة للتحميل');
      return;
    }
    exportCanvas.toBlob(
      (blob) => {
        exportCanvas.width = 0;
        exportCanvas.height = 0;
        if (!blob) {
          toast.error('تعذر تجهيز صورة البطاقة للتحميل');
          return;
        }
        downloadBlob(
          blob,
          createDownloadFileName(index, 'jpg'),
        );
      },
      'image/jpeg',
      0.96,
    );
  };

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div>
        <h3 className="text-sm font-semibold">معاينة البطاقة بعد التركيب</h3>
        <p className="text-xs text-muted-foreground">مقاس A4 عمودي: 2480 × 3508 بكسل (300 نقطة/بوصة)</p>
      </div>
      <div className="max-h-[60vh] overflow-auto rounded-md bg-white">
        <canvas
          ref={canvasRef}
          aria-label="معاينة البطاقة المجمعة: الوجه بالأعلى والظهر بالأسفل"
          className={`mx-auto h-auto max-h-[60vh] w-full object-contain ${isReady ? 'block' : 'hidden'}`}
        />
      </div>
      {!isReady && !previewError && (
        <p className="py-5 text-center text-sm text-muted-foreground">جاري تركيب الوجه والظهر...</p>
      )}
      {previewError && <p className="text-sm text-destructive">{previewError}</p>}
      <Button type="button" className="w-full gap-2" onClick={download} disabled={!isReady}>
        <Download className="size-4" />
        تحميل البطاقة المجمعة
      </Button>
    </div>
  );
}

export function CardImagesPage() {
  const [photos, setPhotos] = useState<CardPhoto[]>([]);
  const [cards, setCards] = useState<GroupedCard[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [selectedFront, setSelectedFront] = useState('');
  const [selectedBack, setSelectedBack] = useState('');
  const [editingCropPhotoId, setEditingCropPhotoId] = useState('');
  const [editingTransform, setEditingTransform] = useState<ImageTransform>({ ...DEFAULT_IMAGE_TRANSFORM });
  const [cropSelection, setCropSelection] = useState<CropSelection | null>(null);
  const [cropPreviewSize, setCropPreviewSize] = useState<{ photoId: string; width: number; height: number } | null>(null);
  const [cropPreviewReady, setCropPreviewReady] = useState(false);
  const [cropPreviewError, setCropPreviewError] = useState('');
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const photoUrls = useRef(new Set<string>());
  const uploadInput = useRef<HTMLInputElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropPreviewSourceRef = useRef<CropPreviewSource | null>(null);
  const processingRef = useRef(false);
  const cropDragRef = useRef<{ x: number; y: number } | null>(null);
  const mountedRef = useRef(true);
  const unmatchedPhotos = photos.filter((photo) => (
    !cards.some((card) => card.frontPhotoId === photo.id || card.backPhotoId === photo.id)
  ));
  const editingCropPhoto = photos.find((photo) => photo.id === editingCropPhotoId);
  const cropPreviewDimensions = editingCropPhoto
    ? cropPreviewSize?.photoId === editingCropPhoto.id ? cropPreviewSize : editingCropPhoto
    : null;
  const hasTransformChanges = editingTransform.rotation !== 0
    || editingTransform.tiltX !== 0
    || editingTransform.tiltY !== 0;
  const hasValidCropSelection = Boolean(
    cropSelection && cropSelection.width >= 0.03 && cropSelection.height >= 0.03,
  );
  const canApplyCrop = hasValidCropSelection || (!cropSelection && hasTransformChanges);

  useEffect(() => {
    mountedRef.current = true;
    const urls = photoUrls.current;
    return () => {
      mountedRef.current = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
      if (cropPreviewSourceRef.current) {
        cropPreviewSourceRef.current.canvas.width = 0;
        cropPreviewSourceRef.current.canvas.height = 0;
        cropPreviewSourceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    const photo = editingCropPhoto;
    setCropPreviewReady(false);
    setCropPreviewError('');
    setCropPreviewSize(null);

    if (!photo) {
      if (cropPreviewSourceRef.current) {
        cropPreviewSourceRef.current.canvas.width = 0;
        cropPreviewSourceRef.current.canvas.height = 0;
        cropPreviewSourceRef.current = null;
      }
      return () => {
        active = false;
      };
    }

    const cachedSource = cropPreviewSourceRef.current;
    if (cachedSource && cachedSource.url !== photo.url) {
      cachedSource.canvas.width = 0;
      cachedSource.canvas.height = 0;
      cropPreviewSourceRef.current = null;
    }

    const drawPreview = (source: HTMLCanvasElement, width: number, height: number) => {
      if (!active || !cropCanvasRef.current) return;
      try {
        const size = drawImageTransformToCanvas(
          cropCanvasRef.current,
          source,
          width,
          height,
          editingTransform,
        );
        setCropPreviewSize({ photoId: photo.id, ...size });
        setCropPreviewReady(true);
      } catch (error) {
        console.error('تعذر تجهيز معاينة القص:', error);
        setCropPreviewError('تعذر تجهيز معاينة الصورة للتحرير');
      }
    };

    const currentSource = cropPreviewSourceRef.current;
    if (currentSource?.url === photo.url) {
      drawPreview(currentSource.canvas, currentSource.width, currentSource.height);
    } else {
      void loadImage(photo.url)
        .then((image) => {
          if (!active) return;
          const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
          const width = Math.max(1, Math.round(image.naturalWidth * scale));
          const height = Math.max(1, Math.round(image.naturalHeight * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('تعذر تجهيز الصورة للتحرير');
          context.drawImage(image, 0, 0, width, height);
          cropPreviewSourceRef.current = { url: photo.url, canvas, width, height };
          drawPreview(canvas, width, height);
        })
        .catch((error: unknown) => {
          if (!active) return;
          console.error('تعذر تحميل صورة القص اليدوي:', error);
          setCropPreviewError('تعذر تحميل الصورة للقص اليدوي');
        });
    }

    return () => {
      active = false;
    };
  }, [editingCropPhoto, editingTransform]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0 || processingRef.current) return;

    processingRef.current = true;
    setIsProcessing(true);
    const newPhotos: CardPhoto[] = [];

    try {
      setProcessingStatus('جاري تحميل الصور...');
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.error(`الملف ليس صورة: ${file.name}`);
          continue;
        }

        const url = URL.createObjectURL(file);
        photoUrls.current.add(url);
        try {
          const image = await loadImage(url);
          if (!mountedRef.current) {
            URL.revokeObjectURL(url);
            photoUrls.current.delete(url);
            return;
          }
          newPhotos.push({
            id: crypto.randomUUID(),
            name: file.name,
            url,
            blob: file,
            side: null,
            rotation: 0,
            cropped: false,
            width: image.naturalWidth,
            height: image.naturalHeight,
            originalBlob: file,
            originalWidth: image.naturalWidth,
            originalHeight: image.naturalHeight,
          });
        } catch (error) {
          URL.revokeObjectURL(url);
          photoUrls.current.delete(url);
          console.error('تعذر تحميل صورة البطاقة:', error);
          toast.error('تعذر تحميل إحدى الصور المحددة');
        }
      }

      if (mountedRef.current && newPhotos.length > 0) {
        setPhotos((current) => [...current, ...newPhotos]);
        toast.success(`تم تحميل ${newPhotos.length} صورة. اختر الوجه والظهر ثم عدّل القص يدويًا.`);
      }
    } finally {
      processingRef.current = false;
      if (mountedRef.current) {
        setIsProcessing(false);
        setProcessingStatus('');
      }
    }
  };

  const handleManualPair = () => {
    if (!selectedFront || !selectedBack) {
      toast.error('اختر صورة الوجه وصورة الظهر');
      return;
    }
    if (selectedFront === selectedBack) {
      toast.error('اختر صورتين مختلفتين للوجه والظهر');
      return;
    }
    setCards((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        frontPhotoId: selectedFront,
        backPhotoId: selectedBack,
      },
    ]);
    setPhotos((current) => current.map((photo) => (
      photo.id === selectedFront || photo.id === selectedBack
        ? { ...photo, side: photo.id === selectedFront ? 'front' : 'back' }
        : photo
    )));
    setSelectedFront('');
    setSelectedBack('');
    toast.success('تم ربط الوجه بالظهر');
  };

  const swapCardSides = (cardId: string) => {
    const card = cards.find((item) => item.id === cardId);
    if (!card?.frontPhotoId || !card.backPhotoId) return;
    setCards((current) => current.map((item) => (
      item.id === cardId
        ? { ...item, frontPhotoId: card.backPhotoId, backPhotoId: card.frontPhotoId }
        : item
    )));
    setPhotos((current) => current.map((photo) => (
      photo.id === card.frontPhotoId
        ? { ...photo, side: 'back' }
        : photo.id === card.backPhotoId
          ? { ...photo, side: 'front' }
          : photo
    )));
  };

  const unlinkCard = (cardId: string) => {
    const card = cards.find((item) => item.id === cardId);
    setCards((current) => current.filter((item) => item.id !== cardId));
    if (!card) return;
    setPhotos((current) => current.map((photo) => (
      photo.id === card.frontPhotoId || photo.id === card.backPhotoId
        ? { ...photo, side: null }
        : photo
    )));
  };

  const removePhoto = (photoId: string) => {
    const photo = photos.find((item) => item.id === photoId);
    if (photo) {
      URL.revokeObjectURL(photo.url);
      photoUrls.current.delete(photo.url);
    }
    setPhotos((current) => current.filter((photo) => photo.id !== photoId));
    setCards((current) => current
      .map((card) => ({
        ...card,
        frontPhotoId: card.frontPhotoId === photoId ? undefined : card.frontPhotoId,
        backPhotoId: card.backPhotoId === photoId ? undefined : card.backPhotoId,
      }))
      .filter((card) => card.frontPhotoId || card.backPhotoId));
    if (selectedFront === photoId) setSelectedFront('');
    if (selectedBack === photoId) setSelectedBack('');
  };

  const restoreOriginalPhoto = (photoId: string) => {
    const photo = photos.find((item) => item.id === photoId);
    if (!photo || photo.blob === photo.originalBlob) return;

    try {
      const url = URL.createObjectURL(photo.originalBlob);
      photoUrls.current.add(url);
      URL.revokeObjectURL(photo.url);
      photoUrls.current.delete(photo.url);
      setPhotos((current) => current.map((item) => (
        item.id === photoId
          ? {
            ...item,
            blob: photo.originalBlob,
            url,
            rotation: 0,
            cropped: false,
            width: photo.originalWidth,
            height: photo.originalHeight,
          }
          : item
      )));
      toast.success('تمت استعادة الصورة الأصلية');
    } catch (error) {
      console.error('تعذر استعادة الصورة الأصلية:', error);
      toast.error('تعذرت استعادة الصورة الأصلية');
    }
  };

  const openCropEditor = (photoId: string) => {
    setEditingTransform({ ...DEFAULT_IMAGE_TRANSFORM });
    setEditingCropPhotoId(photoId);
    setCropSelection(null);
  };

  const updatePhotoTransform = (key: TransformKey, value: number) => {
    setCropSelection(null);
    setEditingTransform((current) => ({ ...current, [key]: value }));
  };

  const resetPhotoTransform = () => {
    setCropSelection(null);
    setEditingTransform({ ...DEFAULT_IMAGE_TRANSFORM });
  };

  const rotatePhoto = async (photoId: string, degrees: 90 | -90) => {
    const photo = photos.find((item) => item.id === photoId);
    if (!photo) return;
    try {
      const rotated = await rotateImage(photo.blob, degrees);
      if (!mountedRef.current || !photoUrls.current.has(photo.url)) return;
      const url = URL.createObjectURL(rotated.blob);
      photoUrls.current.add(url);
      URL.revokeObjectURL(photo.url);
      photoUrls.current.delete(photo.url);
      setPhotos((current) => current.map((item) => item.id === photoId
        ? {
          ...item,
          url,
          blob: rotated.blob,
          rotation: (item.rotation + degrees + 360) % 360,
          width: rotated.width,
          height: rotated.height,
        }
        : item));
    } catch (error) {
      console.error('تعذر تدوير صورة البطاقة يدويًا:', error);
      toast.error('تعذر تدوير الصورة');
    }
  };

  const startCropSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    cropDragRef.current = { x, y };
    setCropSelection({ x, y, width: 0, height: 0 });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateCropSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!cropDragRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    const start = cropDragRef.current;
    setCropSelection({
      x: Math.min(start.x, x),
      y: Math.min(start.y, y),
      width: Math.abs(x - start.x),
      height: Math.abs(y - start.y),
    });
  };

  const finishCropSelection = () => {
    cropDragRef.current = null;
  };

  const applyManualCrop = async () => {
    const photo = photos.find((item) => item.id === editingCropPhotoId);
    if (!photo) return;
    if (cropSelection && !hasValidCropSelection) {
      toast.error('اسحب على الصورة لتحديد مساحة البطاقة أولًا');
      return;
    }
    if (!cropSelection && !hasTransformChanges) return;

    setIsApplyingCrop(true);
    try {
      const selection = cropSelection ?? { x: 0, y: 0, width: 1, height: 1 };
      const cropped = await cropImage(photo.blob, selection, editingTransform);
      if (!mountedRef.current || !photoUrls.current.has(photo.url)) return;
      const url = URL.createObjectURL(cropped.blob);
      photoUrls.current.add(url);
      URL.revokeObjectURL(photo.url);
      photoUrls.current.delete(photo.url);
      setPhotos((current) => current.map((item) => item.id === photo.id
        ? {
          ...item,
          blob: cropped.blob,
          url,
          width: cropped.width,
          height: cropped.height,
          cropped: true,
        }
        : item));
      setEditingCropPhotoId('');
      setCropSelection(null);
      toast.success('تم قص الصورة إلى حدود البطاقة');
    } catch (error) {
      console.error('تعذر قص صورة البطاقة يدويًا:', error);
      toast.error('تعذر قص الصورة');
    } finally {
      if (mountedRef.current) setIsApplyingCrop(false);
    }
  };

  return (
    <main className="space-y-6 text-start" dir="rtl">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">تجميع صور البطاقات الشخصية</h1>
        <p className="text-sm text-muted-foreground">
          ارفع الصور وحدّد الوجه والظهر يدويًا، ثم اضبط القصّ والدوران والمنظور لكل صورة. تتم المعالجة في المتصفح فقط ولا تُحفظ الصور على خادم.
        </p>
      </header>

      <section className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Images className="size-5 text-primary" />
            <div>
              <h2 className="font-medium">الخطوة الأولى: اختيار الصور</h2>
              <p className="text-sm text-muted-foreground">اختر صور الوجه والظهر التي تريد جمعها معًا.</p>
            </div>
          </div>
          <input
            ref={uploadInput}
            className="hidden"
            type="file"
            multiple
            accept="image/*"
            onChange={(event) => void handleUpload(event)}
          />
          <Button type="button" variant="outline" onClick={() => uploadInput.current?.click()} disabled={isProcessing} className="gap-2">
            <Images className="size-4" />
            {isProcessing ? (processingStatus || 'جاري تحميل الصور...') : 'اختيار الصور'}
          </Button>
        </div>
      </section>

      {unmatchedPhotos.length > 0 && (
        <section className="space-y-4 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <Link2 className="size-5 text-primary" />
            <h2 className="font-semibold">الخطوة الثانية: ربط الصور يدويًا</h2>
            <span className="text-sm text-muted-foreground">({unmatchedPhotos.length} غير مرتبطة)</span>
          </div>
          <p className="text-sm text-muted-foreground">
            حدّد صورة كوجه وأخرى كظهر من الأزرار الموجودة على كل صورة، ثم اضغط «إنشاء معاينة». لا توجد قراءة أو مطابقة تلقائية.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {unmatchedPhotos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-lg border bg-background">
                <img src={photo.url} alt={photo.name} className="aspect-video w-full object-contain bg-muted" />
                <div className="space-y-2 p-2">
                  {/* <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-xs" title={photo.name}>{photo.name}</span>
                    <span className="px-1 text-[11px] text-muted-foreground">
                      {photo.cropped ? 'تم القص يدويًا' : 'قص يدوي'}
                    </span>
                  </div> */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant={selectedFront === photo.id ? 'default' : 'outline'} disabled={isProcessing} aria-pressed={selectedFront === photo.id} onClick={() => setSelectedFront(photo.id)}>
                        {selectedFront === photo.id && <Check className="me-1 size-4" />}
                        اختيار كوجه
                      </Button>
                      <Button type="button" size="sm" variant={selectedBack === photo.id ? 'default' : 'outline'} disabled={isProcessing} aria-pressed={selectedBack === photo.id} onClick={() => setSelectedBack(photo.id)}>
                        {selectedBack === photo.id && <Check className="me-1 size-4" />}
                        اختيار كظهر
                      </Button>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <Button type="button" variant="ghost" size="icon-sm" disabled={isProcessing} aria-label={`تدوير ${photo.name} عكس عقارب الساعة`} onClick={() => void rotatePhoto(photo.id, -90)}>
                        <RotateCcw className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" disabled={isProcessing} aria-label={`تدوير ${photo.name} مع عقارب الساعة`} onClick={() => void rotatePhoto(photo.id, 90)}>
                        <RotateCw className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" disabled={isProcessing} aria-label={`قص ${photo.name}`} onClick={() => openCropEditor(photo.id)}>
                        <Crop className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" disabled={isProcessing || photo.blob === photo.originalBlob} aria-label={`استعادة الصورة الأصلية لـ ${photo.name}`} title="استعادة الصورة الأصلية" onClick={() => restoreOriginalPhoto(photo.id)}>
                        <History className="size-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" disabled={isProcessing} aria-label={`حذف ${photo.name}`} onClick={() => removePhoto(photo.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={handleManualPair} disabled={isProcessing || !selectedFront || !selectedBack} className="gap-2">
              <Link2 className="size-4" />
              إنشاء معاينة
            </Button>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">البطاقات المجمعة</h2>
          <span className="text-sm text-muted-foreground">{cards.length} بطاقة</span>
        </div>
        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            <UserRound className="mx-auto mb-2 size-8" />
            <p>اختر الوجه والظهر يدويًا، ثم قصّ الصور أو دوّرها حسب الحاجة لعرض المعاينة.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card, index) => {
              const front = photos.find((photo) => photo.id === card.frontPhotoId);
              const back = photos.find((photo) => photo.id === card.backPhotoId);
              return (
                <article key={card.id} className="overflow-hidden rounded-xl border bg-card">
                  <div className="flex items-center justify-between gap-2 border-b p-3">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      بطاقة مجمعة {index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!front || !back || isProcessing}
                        onClick={() => swapCardSides(card.id)}
                        className="gap-2"
                      >
                        <ArrowUpDown className="size-4" />
                        تبديل الوجه والظهر
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" disabled={isProcessing} aria-label="فك ارتباط البطاقة" onClick={() => unlinkCard(card.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3 p-3">
                    {([
                      ['front', 'وجه البطاقة', front],
                      ['back', 'ظهر البطاقة', back],
                    ] as const).map(([side, label, photo]) => (
                      <div key={side} className="overflow-hidden rounded-lg border">
                        <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2 text-sm">
                          <span>{label}</span>
                          {photo && (
                            <div className="flex items-center">
                              {/* <span className="text-[11px] text-muted-foreground">{photo.cropped ? 'تم القص يدويًا' : 'قص يدوي'}</span> */}
                              <Button type="button" variant="ghost" size="icon-sm" disabled={isProcessing} aria-label={`تدوير ${label} عكس عقارب الساعة`} onClick={() => void rotatePhoto(photo.id, -90)}>
                                <RotateCcw className="size-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon-sm" disabled={isProcessing} aria-label={`تدوير ${label} مع عقارب الساعة`} onClick={() => void rotatePhoto(photo.id, 90)}>
                                <RotateCw className="size-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon-sm" disabled={isProcessing} aria-label={`قص ${label}`} onClick={() => openCropEditor(photo.id)}>
                                <Crop className="size-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon-sm" disabled={isProcessing || photo.blob === photo.originalBlob} aria-label={`استعادة الصورة الأصلية لـ ${photo.name}`} title="استعادة الصورة الأصلية" onClick={() => restoreOriginalPhoto(photo.id)}>
                                <History className="size-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon-sm" disabled={isProcessing} aria-label={`حذف ${label}`} onClick={() => removePhoto(photo.id)}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {photo ? (
                          <img src={photo.url} alt={label} className="aspect-video w-full bg-muted object-contain" />
                        ) : (
                          <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">الصورة غير متوفرة</div>
                        )}
                      </div>
                    ))}
                    {front && back ? (
                      <CombinedCardPreview
                        key={`${front.url}:${back.url}`}
                        front={front}
                        back={back}
                        index={index}
                      />
                    ) : (
                      <p className="text-center text-xs text-muted-foreground">أضف الوجه والظهر لتظهر المعاينة والتحميل.</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {editingCropPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 sm:p-4">
          <section className="flex h-[calc(100dvh-4rem)] min-h-0 w-full max-w-3xl flex-col gap-2 overflow-hidden rounded-xl bg-background p-3 shadow-xl sm:p-4">
            <div className="shrink-0">
              <h2 className="truncate text-base font-semibold">قص البطاقة يدويًا: {editingCropPhoto.name}</h2>
              <p className="text-xs text-muted-foreground">اسحب على الصورة لتحديد الجزء المطلوب قصّه.</p>
            </div>
            <div
              className="flex min-h-0 flex-1 items-center justify-center overflow-hidden"
            >
              <div
                className="relative max-h-full max-w-full touch-none overflow-hidden rounded-lg border bg-muted"
                style={{
                  aspectRatio: `${cropPreviewDimensions?.width ?? editingCropPhoto.width} / ${cropPreviewDimensions?.height ?? editingCropPhoto.height}`,
                  width: `min(100%, calc((100dvh - 19rem) * ${(cropPreviewDimensions?.width ?? editingCropPhoto.width) / (cropPreviewDimensions?.height ?? editingCropPhoto.height)}))`,
                }}
              onPointerDown={cropPreviewReady && !isApplyingCrop ? startCropSelection : undefined}
              onPointerMove={cropPreviewReady && !isApplyingCrop ? updateCropSelection : undefined}
              onPointerUp={finishCropSelection}
              onPointerCancel={finishCropSelection}
            >
              <canvas
                ref={cropCanvasRef}
                aria-label="معاينة الصورة بعد تعديل الدوران والمنظور"
                className={`pointer-events-none absolute inset-0 size-full select-none ${cropPreviewReady ? '' : 'invisible'}`}
              />
              {!cropPreviewReady && !cropPreviewError && (
                <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  جاري تجهيز معاينة الصورة...
                </p>
              )}
              {cropSelection && cropPreviewReady && (
                <div
                  className="pointer-events-none absolute border-2 border-primary bg-primary/15"
                  style={{
                    left: `${cropSelection.x * 100}%`,
                    top: `${cropSelection.y * 100}%`,
                    width: `${cropSelection.width * 100}%`,
                    height: `${cropSelection.height * 100}%`,
                  }}
                />
              )}
              </div>
            </div>
            {cropPreviewError && <p className="text-sm text-destructive">{cropPreviewError}</p>}
            <PhotoTransformControls
              transform={editingTransform}
              onChange={updatePhotoTransform}
              onReset={resetPhotoTransform}
              disabled={isApplyingCrop}
            />
            <div className="flex shrink-0 justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setEditingCropPhotoId(''); setEditingTransform({ ...DEFAULT_IMAGE_TRANSFORM }); setCropSelection(null); }} disabled={isApplyingCrop}>
                إلغاء
              </Button>
              {canApplyCrop && (
                <Button type="button" onClick={() => void applyManualCrop()} disabled={!cropPreviewReady || isApplyingCrop}>
                {isApplyingCrop ? 'جاري تطبيق التعديلات...' : 'اعتماد القص والتعديلات'}
                </Button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

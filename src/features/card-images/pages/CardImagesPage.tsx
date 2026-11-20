import { useEffect, useRef, useState } from 'react';
import {
  Download,
  Crop,
  Images,
  Link2,
  RotateCcw,
  RotateCw,
  ScanLine,
  Trash2,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  processCardImage,
  normalizeDigits,
  type CardSide,
} from '../lib/image-processing';

interface CardPhoto {
  id: string;
  name: string;
  url: string;
  blob: Blob;
  side: CardSide | null;
  nationalId: string;
  rotation: number;
  cropped: boolean;
  processed: boolean;
  width: number;
  height: number;
}

interface GroupedCard {
  id: string;
  nationalId: string;
  frontPhotoId?: string;
  backPhotoId?: string;
}

interface CropSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CARD_WIDTH = 1586;
const CARD_HEIGHT = 1000;

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('تعذر تحميل إحدى صور البطاقة'));
    image.src = url;
  });
}

function drawCardImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  y: number,
) {
  const targetRatio = CARD_WIDTH / CARD_HEIGHT;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  if (imageRatio > targetRatio) {
    sourceWidth = image.naturalHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    y,
    CARD_WIDTH,
    CARD_HEIGHT,
  );
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

function CombinedCardPreview({
  card,
  front,
  back,
}: {
  card: GroupedCard;
  front: CardPhoto;
  back: CardPhoto;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    let active = true;
    setIsReady(false);
    setPreviewError('');

    void Promise.all([loadImage(front.url), loadImage(back.url)])
      .then(([frontImage, backImage]) => {
        if (!active || !canvasRef.current) return;
        const gap = 24;
        const canvas = canvasRef.current;
        canvas.width = CARD_WIDTH;
        canvas.height = CARD_HEIGHT * 2 + gap;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('تعذر تجهيز معاينة البطاقة');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        drawCardImage(context, frontImage, 0);
        drawCardImage(context, backImage, CARD_HEIGHT + gap);
        setIsReady(true);
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

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas || !isReady) return;
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error('تعذر تجهيز صورة البطاقة للتحميل');
          return;
        }
        downloadBlob(blob, `card-${card.nationalId || 'new'}.jpg`);
      },
      'image/jpeg',
      0.96,
    );
  };

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <h3 className="text-sm font-semibold">معاينة البطاقة بعد التركيب</h3>
      <canvas
        ref={canvasRef}
        aria-label="معاينة البطاقة المجمعة: الوجه بالأعلى والظهر بالأسفل"
        className={`mx-auto h-auto max-h-[60vh] w-full bg-muted object-contain ${isReady ? 'block' : 'hidden'}`}
      />
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
  const [manualNationalId, setManualNationalId] = useState('');
  const [editingCropPhotoId, setEditingCropPhotoId] = useState('');
  const [cropSelection, setCropSelection] = useState<CropSelection | null>(null);
  const photoUrls = useRef(new Set<string>());
  const uploadInput = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);
  const cropDragRef = useRef<{ x: number; y: number } | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const urls = photoUrls.current;
    return () => {
      mountedRef.current = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const unmatchedPhotos = photos.filter((photo) => (
    !cards.some((card) => card.frontPhotoId === photo.id || card.backPhotoId === photo.id)
  ));
  const editingCropPhoto = photos.find((photo) => photo.id === editingCropPhotoId);

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
            nationalId: '',
            rotation: 0,
            cropped: false,
            processed: false,
            width: image.naturalWidth,
            height: image.naturalHeight,
          });
        } catch (error) {
          URL.revokeObjectURL(url);
          photoUrls.current.delete(url);
          console.error(`تعذر تحميل الصورة ${file.name}:`, error);
          toast.error(`تعذر تحميل الصورة: ${file.name}`);
        }
      }

      if (mountedRef.current && newPhotos.length > 0) {
        setPhotos((current) => [...current, ...newPhotos]);
        toast.success(`تم تحميل ${newPhotos.length} صورة. اضغط «قص وتجهيز الصور» للمتابعة.`);
      }
    } finally {
      processingRef.current = false;
      if (mountedRef.current) {
        setIsProcessing(false);
        setProcessingStatus('');
      }
    }
  };

  const preparePhotos = async () => {
    if (processingRef.current) return;
    if (unmatchedPhotos.length === 0) {
      toast.error('اختر الصور أولًا');
      return;
    }
    const photosToProcess = unmatchedPhotos.filter((photo) => !photo.processed);
    if (photosToProcess.length === 0) {
      toast.info('الصور جاهزة. اختر يدويًا الوجه والظهر اللذين يخصان البطاقة نفسها.');
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setProcessingStatus('جاري قصّ الصور وضبط اتجاهها...');
    let rotatedCount = 0;
    let failedCount = 0;
    let preparedCount = 0;

    try {
      const preparedById = new Map<string, CardPhoto>();
      for (const [index, photo] of photosToProcess.entries()) {
        setProcessingStatus(`جاري تجهيز الصورة ${index + 1} من ${photosToProcess.length}...`);
        try {
          const prepared = await processCardImage(photo.blob);
          if (!mountedRef.current) return;
          if (prepared.rotation !== 0) rotatedCount += 1;
          preparedCount += 1;
          const url = URL.createObjectURL(prepared.blob);
          photoUrls.current.add(url);
          URL.revokeObjectURL(photo.url);
          photoUrls.current.delete(photo.url);
          preparedById.set(photo.id, {
            ...photo,
            blob: prepared.blob,
            url,
            rotation: prepared.rotation,
            cropped: prepared.cropped,
            processed: true,
            width: prepared.width,
            height: prepared.height,
          });
        } catch (error) {
          failedCount += 1;
          console.error(`تعذرت معالجة الصورة ${photo.name}:`, error);
          toast.error(`تعذرت معالجة الصورة: ${photo.name}`);
        }
      }

      const preparedPhotos = photos.map((photo) => preparedById.get(photo.id) ?? photo);
      setPhotos(preparedPhotos);
      if (failedCount > 0) {
        toast.error('لم يكتمل تجهيز بعض الصور. أعد الضغط على «قص وتجهيز الصور».');
        return;
      }

      setPhotos(preparedPhotos);
      if (rotatedCount > 0) toast.success(`تم تصحيح اتجاه ${rotatedCount} صورة`);
      toast.success(`تم قص وتجهيز ${preparedCount} صورة. اختر الوجه والظهر الصحيحين يدويًا لتجنب خلط البطاقات.`);
    } finally {
      processingRef.current = false;
      if (mountedRef.current) {
        setIsProcessing(false);
        setProcessingStatus('');
      }
    }
  };

  const handleManualPair = () => {
    const nationalId = normalizeDigits(manualNationalId).trim();
    if (!selectedFront && !selectedBack) {
      toast.error('اختر صورة وجه أو ظهر واحدة على الأقل');
      return;
    }
    if (selectedFront && selectedFront === selectedBack) {
      toast.error('اختر صورتين مختلفتين للوجه والظهر');
      return;
    }
    if (nationalId && !/^\d{14}$/.test(nationalId)) {
      toast.error('يجب أن يتكون الرقم القومي من 14 رقمًا');
      return;
    }

    const matchingCard = nationalId ? cards.find((card) => card.nationalId === nationalId) : undefined;
    if (
      matchingCard &&
      ((selectedFront && matchingCard.frontPhotoId) || (selectedBack && matchingCard.backPhotoId))
    ) {
      toast.error('توجد صورة مرتبطة بهذا الرقم بالفعل في نفس الجهة؛ فك ارتباط البطاقة أولًا');
      return;
    }

    setCards((current) => matchingCard
      ? current.map((card) => card.id === matchingCard.id
        ? {
          ...card,
          ...(selectedFront ? { frontPhotoId: selectedFront } : {}),
          ...(selectedBack ? { backPhotoId: selectedBack } : {}),
        }
        : card)
      : [
        ...current,
        {
          id: crypto.randomUUID(),
          nationalId,
          ...(selectedFront ? { frontPhotoId: selectedFront } : {}),
          ...(selectedBack ? { backPhotoId: selectedBack } : {}),
        },
      ]);
    setPhotos((current) => current.map((photo) => (
      photo.id === selectedFront || photo.id === selectedBack
        ? { ...photo, nationalId, side: photo.id === selectedFront ? 'front' : 'back' }
        : photo
    )));
    setSelectedFront('');
    setSelectedBack('');
    setManualNationalId('');
    toast.success(nationalId ? 'تم ربط الصور بالرقم القومي' : 'تم إنشاء بطاقة جديدة بدون رقم قومي');
  };

  const updateCardNationalId = (cardId: string, value: string) => {
    const nationalId = normalizeDigits(value).replace(/\D/g, '').slice(0, 14);
    setCards((current) => current.map((card) => (
      card.id === cardId ? { ...card, nationalId } : card
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

  const rotatePhoto = async (photoId: string, degrees: 90 | -90) => {
    const photo = photos.find((item) => item.id === photoId);
    if (!photo) return;
    try {
      const image = await loadImage(photo.url);
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalHeight;
      canvas.height = image.naturalWidth;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('تعذر تجهيز الصورة للتدوير');
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((degrees * Math.PI) / 180);
      context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => result ? resolve(result) : reject(new Error('تعذر تدوير الصورة')),
          'image/jpeg',
          0.96,
        );
      });
      if (!mountedRef.current || !photoUrls.current.has(photo.url)) return;
      const url = URL.createObjectURL(blob);
      photoUrls.current.add(url);
      URL.revokeObjectURL(photo.url);
      photoUrls.current.delete(photo.url);
      setPhotos((current) => current.map((item) => item.id === photoId
        ? {
          ...item,
          url,
          blob,
          rotation: (item.rotation + degrees + 360) % 360,
          width: canvas.width,
          height: canvas.height,
        }
        : item));
    } catch (error) {
      console.error('تعذر تدوير الصورة يدويًا:', error);
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
    if (!photo || !cropSelection || cropSelection.width < 0.03 || cropSelection.height < 0.03) {
      toast.error('اسحب على الصورة لتحديد مساحة البطاقة أولًا');
      return;
    }

    try {
      const bitmap = await createImageBitmap(photo.blob);
      try {
        const x = Math.round(cropSelection.x * bitmap.width);
        const y = Math.round(cropSelection.y * bitmap.height);
        const width = Math.min(bitmap.width - x, Math.round(cropSelection.width * bitmap.width));
        const height = Math.min(bitmap.height - y, Math.round(cropSelection.height * bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('تعذر تجهيز القص اليدوي');
        context.drawImage(bitmap, x, y, width, height, 0, 0, width, height);
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (result) => result ? resolve(result) : reject(new Error('تعذر حفظ القص اليدوي')),
            'image/jpeg',
            0.96,
          );
        });
        if (!mountedRef.current || !photoUrls.current.has(photo.url)) return;
        const url = URL.createObjectURL(blob);
        photoUrls.current.add(url);
        URL.revokeObjectURL(photo.url);
        photoUrls.current.delete(photo.url);
        setPhotos((current) => current.map((item) => item.id === photo.id
          ? { ...item, blob, url, width, height, cropped: true }
          : item));
      } finally {
        bitmap.close();
      }
      setEditingCropPhotoId('');
      setCropSelection(null);
      toast.success('تم قص الصورة إلى حدود البطاقة');
    } catch (error) {
      console.error('تعذر قص الصورة يدويًا:', error);
      toast.error('تعذر قص الصورة');
    }
  };

  const unlinkCard = (cardId: string) => {
    setCards((current) => current.filter((card) => card.id !== cardId));
  };

  const renderPhotoOptions = () => (
    unmatchedPhotos.map((photo) => (
      <option key={photo.id} value={photo.id}>{photo.name}</option>
    ))
  );

  return (
    <main className="space-y-6 text-start" dir="rtl">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">تجميع صور البطاقات الشخصية</h1>
        <p className="text-sm text-muted-foreground">
          ارفع الصور ثم اضغط «قص وتجهيز الصور». بعد ذلك اختر بنفسك الوجه والظهر اللذين يخصان الشخص نفسه؛ لا يتم تخمين الربط أو تحميل ملفات OCR.
        </p>
      </header>

      <section className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Images className="size-5 text-primary" />
            <div>
              <h2 className="font-medium">الخطوة الأولى: اختيار الصور</h2>
              <p className="text-sm text-muted-foreground">لا يلزم ترتيب الصور عند الرفع؛ حدّد الزوج الصحيح بعد ظهور الصور المقصوصة.</p>
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
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => uploadInput.current?.click()} disabled={isProcessing} className="gap-2">
              <Images className="size-4" />
              اختيار الصور
            </Button>
            <Button type="button" onClick={() => void preparePhotos()} disabled={isProcessing || unmatchedPhotos.length === 0} className="gap-2">
              <ScanLine className="size-4" />
              {isProcessing ? (processingStatus || 'جاري التجهيز...') : 'قص وتجهيز الصور'}
            </Button>
          </div>
        </div>
      </section>

      {unmatchedPhotos.length > 0 && (
        <section className="space-y-4 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <Link2 className="size-5 text-primary" />
            <h2 className="font-semibold">الخطوة الثانية: اختيار الوجه والظهر المطابقين</h2>
            <span className="text-sm text-muted-foreground">({unmatchedPhotos.length} غير مرتبطة)</span>
          </div>
          <p className="text-sm text-muted-foreground">
            لا نعتمد على ترتيب الملفات لتجنب خلط البطاقات. اختر الصورتين اللتين تخصان الشخص نفسه، ثم أدخل الرقم القومي إن رغبت.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 text-sm">
              <span>صورة الوجه</span>
              <select
                value={selectedFront}
                onChange={(event) => setSelectedFront(event.target.value)}
                disabled={isProcessing}
                className="h-9 w-full rounded-md border border-input bg-background px-3"
              >
                <option value="">بدون اختيار</option>
                {renderPhotoOptions()}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>صورة الظهر</span>
              <select
                value={selectedBack}
                onChange={(event) => setSelectedBack(event.target.value)}
                disabled={isProcessing}
                className="h-9 w-full rounded-md border border-input bg-background px-3"
              >
                <option value="">بدون اختيار</option>
                {renderPhotoOptions()}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span>الرقم القومي (اختياري)</span>
              <Input
                value={manualNationalId}
                onChange={(event) => setManualNationalId(normalizeDigits(event.target.value).replace(/\D/g, '').slice(0, 14))}
                disabled={isProcessing}
                inputMode="numeric"
                maxLength={14}
                placeholder="14 رقمًا أو اتركه فارغًا"
                dir="ltr"
              />
            </label>
            <div className="flex items-end">
              <Button type="button" onClick={handleManualPair} disabled={isProcessing} className="w-full gap-2">
                <Link2 className="size-4" />
                إنشاء / ربط بطاقة
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {unmatchedPhotos.map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-lg border bg-background">
                <img src={photo.url} alt={photo.name} className="aspect-video w-full object-contain bg-muted" />
                <div className="space-y-2 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-xs" title={photo.name}>{photo.name}</span>
                    <span className="px-1 text-[11px] text-muted-foreground">
                      {!photo.processed ? 'بانتظار التجميع' : photo.cropped ? 'تم القص' : 'قص غير مؤكد'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant={selectedFront === photo.id ? 'default' : 'outline'} disabled={isProcessing} aria-pressed={selectedFront === photo.id} onClick={() => setSelectedFront(photo.id)}>
                        اختيار كوجه
                      </Button>
                      <Button type="button" size="sm" variant={selectedBack === photo.id ? 'default' : 'outline'} disabled={isProcessing} aria-pressed={selectedBack === photo.id} onClick={() => setSelectedBack(photo.id)}>
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
                      <Button type="button" variant="ghost" size="icon-sm" disabled={isProcessing} aria-label={`قص ${photo.name}`} onClick={() => { setEditingCropPhotoId(photo.id); setCropSelection(null); }}>
                        <Crop className="size-4" />
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
            <p>بعد قصّ الصور، اختر يدويًا صورة الوجه والظهر للشخص نفسه لعرض البطاقة المجمعة.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card, index) => {
              const front = photos.find((photo) => photo.id === card.frontPhotoId);
              const back = photos.find((photo) => photo.id === card.backPhotoId);
              return (
                <article key={card.id} className="overflow-hidden rounded-xl border bg-card">
                  <div className="flex items-center justify-between gap-2 border-b p-3">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary" dir="ltr">
                      {card.nationalId || `بطاقة جديدة ${index + 1}`}
                    </span>
                    <Input
                      value={card.nationalId}
                      onChange={(event) => updateCardNationalId(card.id, event.target.value)}
                      disabled={isProcessing}
                      inputMode="numeric"
                      maxLength={14}
                      placeholder="أدخل الرقم القومي يدويًا"
                      aria-label={`الرقم القومي للبطاقة ${index + 1}`}
                      dir="ltr"
                      className="max-w-48"
                    />
                    <Button type="button" variant="ghost" size="icon-sm" disabled={isProcessing} aria-label="فك ارتباط البطاقة" onClick={() => unlinkCard(card.id)}>
                      <Trash2 className="size-4" />
                    </Button>
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
                              <span className="text-[11px] text-muted-foreground">{photo.cropped ? 'تم القص' : 'قص غير مؤكد'}</span>
                              <Button type="button" variant="ghost" size="icon-sm" disabled={isProcessing} aria-label={`تدوير ${label} عكس عقارب الساعة`} onClick={() => void rotatePhoto(photo.id, -90)}>
                                <RotateCcw className="size-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon-sm" disabled={isProcessing} aria-label={`تدوير ${label} مع عقارب الساعة`} onClick={() => void rotatePhoto(photo.id, 90)}>
                                <RotateCw className="size-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon-sm" aria-label={`قص ${label}`} onClick={() => { setEditingCropPhotoId(photo.id); setCropSelection(null); }}>
                                <Crop className="size-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon-sm" aria-label={`حذف ${label}`} onClick={() => removePhoto(photo.id)}>
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
                      <CombinedCardPreview key={`${front.url}:${back.url}`} card={card} front={front} back={back} />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 sm:p-6">
          <section className="w-full max-w-3xl space-y-4 rounded-xl bg-background p-4 shadow-xl sm:p-6">
            <div>
              <h2 className="text-lg font-semibold">قص البطاقة يدويًا</h2>
              <p className="text-sm text-muted-foreground">اسحب فوق الصورة لتحديد البطاقة فقط، ثم اضغط «اعتماد القص».</p>
            </div>
            <div
              className="relative mx-auto w-full touch-none overflow-hidden rounded-lg border bg-muted"
              style={{ aspectRatio: `${editingCropPhoto.width} / ${editingCropPhoto.height}` }}
              onPointerDown={startCropSelection}
              onPointerMove={updateCropSelection}
              onPointerUp={finishCropSelection}
              onPointerCancel={finishCropSelection}
            >
              <img src={editingCropPhoto.url} alt="حدد حدود البطاقة" className="pointer-events-none absolute inset-0 size-full select-none object-fill" draggable={false} />
              {cropSelection && (
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
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setEditingCropPhotoId(''); setCropSelection(null); }}>
                إلغاء
              </Button>
              <Button type="button" onClick={() => void applyManualCrop()} disabled={!cropSelection || cropSelection.width < 0.03 || cropSelection.height < 0.03}>
                اعتماد القص
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

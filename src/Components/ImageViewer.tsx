import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImageViewer({ images, initialIndex = 0, onClose }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? images.length - 1 : prev + 1));
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? 0 : prev - 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
    setTouchStart(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center z-50"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      dir="rtl"
    >
      {/* Close Button and Counter */}
      <div className="absolute top-4 right-4 flex items-center gap-4 z-10">
        <div className="text-white text-sm font-semibold bg-black/50 px-3 py-2 rounded">
          {currentIndex + 1} / {images.length}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Previous Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevious}
        disabled={currentIndex === 0}
        className="absolute left-4 z-10 text-white bg-black/50 hover:bg-black/70 disabled:opacity-30 transition-all duration-200 backdrop-blur-sm rounded-full"
      >
        <ChevronLeft className="w-8 h-8" />
      </Button>

      {/* Next Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        disabled={currentIndex === images.length - 1}
        className="absolute right-4 z-10 text-white bg-black/50 hover:bg-black/70 disabled:opacity-30 transition-all duration-200 backdrop-blur-sm rounded-full"
      >
        <ChevronRight className="w-8 h-8" />
      </Button>



      {/* Image */}
      <img
        src={currentImage}
        alt={`صورة ${currentIndex + 1}`}
        className="w-full h-full object-contain"
        draggable={false}
      />



    </div>
  );
}
